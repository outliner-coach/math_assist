/*!
 * Math Assist service worker — hand-written, deterministic, no build step (T5).
 *
 * Cache policy (spec §7):
 *   math-assist-shell:<appRelease>                                landing/home/offline + core assets
 *   math-assist-visited:<appRelease>                              visited same-origin static pages/assets
 *   math-assist-grade:<appRelease>:<contentRelease>:<grade>       complete installed grade packs
 *   math-assist-grade-tmp:<appRelease>:<contentRelease>:<grade>   install staging, always deleted
 *
 * Release ids are read at runtime from /math_assist/release-metadata.json so this file never
 * embeds digests or timestamps. Message protocol is fixed:
 *   requests:  MATH_ASSIST_INSTALL_GRADE_PACK / MATH_ASSIST_REMOVE_GRADE_PACK /
 *              MATH_ASSIST_QUERY_OFFLINE_STATE / MATH_ASSIST_ACTIVATE_UPDATE
 *   responses: MATH_ASSIST_OFFLINE_PROGRESS / MATH_ASSIST_OFFLINE_STATE /
 *              MATH_ASSIST_OFFLINE_ERROR / MATH_ASSIST_UPDATE_READY
 * Every message carries schemaVersion:1. Grade values are 1-6 only. Error payloads carry fixed
 * codes only — never URLs, profile ids, answers, or stored values.
 *
 * Install atomicity: download the pack into a temp cache, verify every URL, activate the final
 * cache name, delete the temp cache, then replace older packs of the same grade. Any failure
 * deletes temp and keeps the previous complete pack. Cache names pin both releases, so mixed
 * release responses cannot be served from a pack. A waiting worker never auto-activates; only
 * MATH_ASSIST_ACTIVATE_UPDATE triggers registration.skipWaiting().
 *
 * Cache operations never enumerate or touch localStorage or IndexedDB.
 */
(function () {
  'use strict'

  var BASE = '/math_assist'
  var METADATA_URL = BASE + '/release-metadata.json'
  var OFFLINE_PAGE = BASE + '/offline/'
  var SHELL_PATHS = ['/', '/home/', '/offline/', '/manifest.webmanifest', '/favicon.ico', '/icons/icon.svg', '/icons/maskable-icon.svg']
  var SHELL_PREFIX = 'math-assist-shell:'
  var VISITED_PREFIX = 'math-assist-visited:'
  var PACK_PATTERN = /^math-assist-grade:([^:]+):([^:]+):([1-6])$/
  var TMP_PREFIX = 'math-assist-grade-tmp:'
  var FIXED_ERROR_CODES = [
    'INVALID_MESSAGE',
    'INVALID_GRADE',
    'METADATA_UNAVAILABLE',
    'PACK_MANIFEST_INVALID',
    'ASSET_FETCH_FAILED',
    'PACK_WRITE_FAILED',
    'QUOTA_EXCEEDED',
    'VERIFY_FAILED',
    'ALREADY_INSTALLING',
    'REMOVE_FAILED',
    'UNKNOWN_MESSAGE'
  ]

  function toUrl(path) {
    return path === '/' ? BASE + '/' : BASE + path
  }

  function isValidGrade(value) {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6
  }

  function codeError(code) {
    var error = new Error(code)
    error.code = code
    return error
  }

  /**
   * @param {Object} env adapter providing { caches, fetch, clients, registration }
   */
  function createCore(env) {
    var metadataPromise = null
    var activeInstalls = {}

    function loadMetadata() {
      if (!metadataPromise) {
        metadataPromise = env.fetch(METADATA_URL, { cache: 'no-store' }).then(function (response) {
          if (!response || !response.ok) {
            throw codeError('METADATA_UNAVAILABLE')
          }
          return response.json().then(function (data) {
            if (
              !data ||
              data.schemaVersion !== 1 ||
              typeof data.appRelease !== 'string' ||
              data.appRelease.length === 0 ||
              typeof data.contentRelease !== 'string' ||
              data.contentRelease.length === 0
            ) {
              throw codeError('METADATA_UNAVAILABLE')
            }
            return data
          })
        })
        metadataPromise.catch(function () {
          metadataPromise = null
        })
      }
      return metadataPromise
    }

    function metadataOrNull() {
      return loadMetadata().catch(function () {
        return null
      })
    }

    function postToSource(source, message) {
      if (source && typeof source.postMessage === 'function') {
        source.postMessage(message)
      }
    }

    function postError(source, code, grade) {
      var payload = { schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_ERROR', code: code }
      if (isValidGrade(grade)) {
        payload.grade = grade
      }
      postToSource(source, payload)
    }

    function listPackCaches() {
      return env.caches.keys().then(function (names) {
        var found = []
        names.forEach(function (name) {
          var match = PACK_PATTERN.exec(name)
          if (match) {
            found.push({
              name: name,
              appRelease: match[1],
              contentRelease: match[2],
              grade: Number(match[3])
            })
          }
        })
        return found
      })
    }

    function computeState() {
      return Promise.all([listPackCaches(), metadataOrNull()]).then(function (results) {
        var packs = results[0]
        var metadata = results[1]
        var grades = {}
        for (var grade = 1; grade <= 6; grade += 1) {
          grades[String(grade)] = 'not-installed'
        }
        packs.forEach(function (pack) {
          if (!metadata || pack.appRelease !== metadata.appRelease) {
            return
          }
          grades[String(pack.grade)] =
            pack.contentRelease === metadata.contentRelease ? 'installed' : 'update-available'
        })
        return {
          schemaVersion: 1,
          type: 'MATH_ASSIST_OFFLINE_STATE',
          appRelease: metadata ? metadata.appRelease : null,
          contentRelease: metadata ? metadata.contentRelease : null,
          updateReady: Boolean(env.registration && env.registration.waiting),
          grades: grades
        }
      })
    }

    function fetchFresh(url, failureCode) {
      return env.fetch(url, { cache: 'no-store' }).then(function (response) {
        if (!response || !response.ok || response.status !== 200) {
          throw codeError(failureCode || 'ASSET_FETCH_FAILED')
        }
        return response
      })
    }

    function putAsset(cache, url, response) {
      return cache.put(url, response).catch(function (error) {
        throw codeError(error && error.name === 'QuotaExceededError' ? 'QUOTA_EXCEEDED' : 'PACK_WRITE_FAILED')
      })
    }

    function validatePackManifest(manifest, metadata, grade) {
      if (
        !manifest ||
        manifest.schemaVersion !== 1 ||
        manifest.grade !== grade ||
        manifest.appRelease !== metadata.appRelease ||
        manifest.contentRelease !== metadata.contentRelease ||
        !Array.isArray(manifest.urls) ||
        manifest.urls.length === 0
      ) {
        throw codeError('PACK_MANIFEST_INVALID')
      }
      manifest.urls.forEach(function (url) {
        if (
          typeof url !== 'string' ||
          url.indexOf(BASE + '/') !== 0 ||
          url.indexOf('?') !== -1 ||
          url.indexOf('#') !== -1
        ) {
          throw codeError('PACK_MANIFEST_INVALID')
        }
      })
    }

    function stageAndActivate(urls, metadata, grade, source) {
      var staging = TMP_PREFIX + metadata.appRelease + ':' + metadata.contentRelease + ':' + grade
      var finalName = 'math-assist-grade:' + metadata.appRelease + ':' + metadata.contentRelease + ':' + grade
      var staged = 0

      return env.caches.delete(staging).then(function () {
        return env.caches.open(staging).then(function (stagedCache) {
          var chain = Promise.resolve()
          urls.forEach(function (url) {
            chain = chain.then(function () {
              return fetchFresh(url).then(function (response) {
                return putAsset(stagedCache, url, response)
              }).then(function () {
                staged += 1
                postToSource(source, {
                  schemaVersion: 1,
                  type: 'MATH_ASSIST_OFFLINE_PROGRESS',
                  grade: grade,
                  completed: staged,
                  total: urls.length
                })
              })
            })
          })

          return chain
            .then(function () {
              var checks = urls.map(function (url) {
                return stagedCache.match(url).then(function (cached) {
                  if (!cached || !cached.ok) {
                    throw codeError('VERIFY_FAILED')
                  }
                })
              })
              return Promise.all(checks).then(function () {
                return undefined
              })
            })
            .then(function () {
              return env.caches.open(finalName).then(function (finalCache) {
                var copies = urls.map(function (url) {
                  return stagedCache.match(url).then(function (cached) {
                    if (!cached) {
                      throw codeError('VERIFY_FAILED')
                    }
                    return finalCache.put(url, cached)
                  })
                })
                return Promise.all(copies).then(function () {
                  return undefined
                })
              })
            })
            .then(function () {
              return env.caches.delete(staging)
            })
            .then(function () {
              return listPackCaches().then(function (packs) {
                var replacements = packs
                  .filter(function (pack) {
                    return pack.grade === grade && pack.name !== finalName
                  })
                  .map(function (pack) {
                    return env.caches.delete(pack.name)
                  })
                return Promise.all(replacements).then(function () {
                  return undefined
                })
              })
            })
            .then(function () {
              return computeState().then(function (state) {
                postToSource(source, state)
              })
            })
            .catch(function (error) {
              return env.caches.delete(staging).then(function () {
                throw error
              })
            })
        })
      })
    }

    function installGradePack(grade, source) {
      if (activeInstalls[grade]) {
        postError(source, 'ALREADY_INSTALLING', grade)
        return Promise.resolve()
      }
      activeInstalls[grade] = true

      var work = loadMetadata()
        .then(function (metadata) {
          return fetchFresh(BASE + '/offline-packs/grade-' + grade + '.json', 'PACK_MANIFEST_INVALID').then(
            function (response) {
              return response.json().then(function (manifest) {
                validatePackManifest(manifest, metadata, grade)
                return stageAndActivate(manifest.urls, metadata, grade, source)
              })
            }
          )
        })

      return work
        .catch(function (error) {
          postError(source, (error && error.code) || 'PACK_MANIFEST_INVALID', grade)
          return computeState().then(function (state) {
            postToSource(source, state)
          })
        })
        .then(function () {
          delete activeInstalls[grade]
        }, function () {
          delete activeInstalls[grade]
        })
    }

    function removeGradePack(grade, source) {
      var removalWork = listPackCaches().then(function (packs) {
        return metadataOrNull().then(function (metadata) {
          var targets = packs.filter(function (pack) {
            return pack.grade === grade && (!metadata || pack.appRelease === metadata.appRelease)
          })
          var removals = targets.map(function (pack) {
            return env.caches.delete(pack.name)
          })
          return Promise.all(removals).then(function () {
            return undefined
          })
        })
      })

      return removalWork
        .then(function () {
          return computeState()
        })
        .then(function (state) {
          postToSource(source, state)
        })
        .catch(function (error) {
          postError(source, (error && error.code) || 'REMOVE_FAILED', grade)
        })
    }

    function handleInstallWork() {
      return metadataOrNull().then(function (metadata) {
        if (!metadata) {
          return undefined
        }
        return env.caches.open(SHELL_PREFIX + metadata.appRelease).then(function (shell) {
          var attempts = SHELL_PATHS.map(function (path) {
            return env
              .fetch(toUrl(path), { cache: 'no-store' })
              .then(function (response) {
                if (response && response.ok) {
                  return shell.put(toUrl(path), response)
                }
                return undefined
              })
              .catch(function () {
                return undefined
              })
          })
          return Promise.all(attempts).then(function () {
            return undefined
          })
        })
      })
    }

    function handleActivateWork() {
      return env.caches.keys().then(function (names) {
        var leftovers = names
          .filter(function (name) {
            return name.indexOf(TMP_PREFIX) === 0
          })
          .map(function (name) {
            return env.caches.delete(name)
          })
        return Promise.all(leftovers).then(function () {
          var claim =
            env.clients && typeof env.clients.claim === 'function' ? env.clients.claim() : Promise.resolve()
          return claim.then(function () {
            if (env.clients && typeof env.clients.matchAll === 'function') {
              return env.clients.matchAll({ type: 'window' }).then(function (clientList) {
                clientList.forEach(function (client) {
                  client.postMessage({ schemaVersion: 1, type: 'MATH_ASSIST_UPDATE_READY' })
                })
              })
            }
            return undefined
          })
        })
      })
    }

    function sameOriginGet(url) {
      if (url.indexOf(BASE) === -1) {
        return false
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
        var origin = (typeof location !== 'undefined' && location.origin) || ''
        return origin.length > 0 && url.indexOf(origin) === 0
      }
      return true
    }

    function matchAcross(prefixes, key) {
      return env.caches.keys().then(function (names) {
        var candidates = names.filter(function (name) {
          return prefixes.some(function (prefix) {
            return name.indexOf(prefix) === 0
          })
        })
        var lookups = candidates.map(function (name) {
          return env.caches.open(name).then(function (cache) {
            return cache.match(key)
          })
        })
        return Promise.all(lookups).then(function (hits) {
          for (var index = 0; index < hits.length; index += 1) {
            if (hits[index]) {
              return hits[index]
            }
          }
          return undefined
        })
      })
    }

    function cachedOfflineNotice() {
      return matchAcross([SHELL_PREFIX, VISITED_PREFIX], OFFLINE_PAGE).then(function (hit) {
        if (hit) {
          return hit
        }
        return new Response(
          '<!doctype html><html lang="ko"><meta charset="utf-8"><title>오프라인</title><p>오프라인 상태입니다.</p>',
          { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }
        )
      })
    }

    function navigationStrategy(request) {
      return metadataOrNull().then(function (metadata) {
        return env
          .fetch(request)
          .then(function (response) {
            if (response && response.ok && metadata) {
              return env.caches.open(VISITED_PREFIX + metadata.appRelease).then(function (visited) {
                return visited.put(request.url, response.clone()).then(function () {
                  return response
                })
              })
            }
            return response
          })
          .catch(function () {
            return matchAcross([VISITED_PREFIX], request.url).then(function (visitedHit) {
              if (visitedHit) {
                return visitedHit
              }
              return matchAcross([SHELL_PREFIX], request.url).then(function (shellHit) {
                if (shellHit) {
                  return shellHit
                }
                return cachedOfflineNotice()
              })
            })
          })
      })
    }

    function staticAssetStrategy(request) {
      return metadataOrNull().then(function (metadata) {
        if (!metadata) {
          return env.fetch(request).catch(function () {
            return new Response('', { status: 504 })
          })
        }
        return env.caches.open(VISITED_PREFIX + metadata.appRelease).then(function (visited) {
          return visited.match(request.url).then(function (hit) {
            if (hit) {
              return hit
            }
            return env
              .fetch(request)
              .then(function (response) {
                if (response && response.ok) {
                  return visited.put(request.url, response.clone()).then(function () {
                    return response
                  })
                }
                return response
              })
              .catch(function () {
                return new Response('', { status: 504 })
              })
          })
        })
      })
    }

    function findInPacks(url, metadata) {
      return listPackCaches().then(function (packs) {
        var candidates = metadata
          ? packs.filter(function (pack) {
              return pack.appRelease === metadata.appRelease
            })
          : packs
        var lookups = candidates.map(function (pack) {
          return env.caches.open(pack.name).then(function (cache) {
            return cache.match(url)
          })
        })
        return Promise.all(lookups).then(function (hits) {
          for (var index = 0; index < hits.length; index += 1) {
            if (hits[index]) {
              return hits[index]
            }
          }
          return undefined
        })
      })
    }

    function dataStrategy(request) {
      return metadataOrNull().then(function (metadata) {
        return findInPacks(request.url, metadata).then(function (packHit) {
          if (packHit) {
            return packHit
          }
          return env
            .fetch(request)
            .then(function (response) {
              if (response && response.ok && metadata) {
                return env.caches.open(VISITED_PREFIX + metadata.appRelease).then(function (visited) {
                  return visited.put(request.url, response.clone()).then(function () {
                    return response
                  })
                })
              }
              return response
            })
            .catch(function () {
              return matchAcross([VISITED_PREFIX], request.url).then(function (hit) {
                if (hit) {
                  return hit
                }
                return new Response('', { status: 504 })
              })
            })
        })
      })
    }

    function onFetch(event) {
      var request = event.request
      if (!request || request.method !== 'GET') {
        return undefined
      }
      if (!sameOriginGet(request.url)) {
        return undefined
      }
      var pathname = request.url.slice(request.url.indexOf(BASE) + BASE.length)

      if (request.mode === 'navigate') {
        return navigationStrategy(request)
      }
      if (pathname.indexOf('/_next/static/') === 0 || pathname.indexOf('/icons/') === 0) {
        return staticAssetStrategy(request)
      }
      if (pathname.indexOf('/data/') === 0) {
        return dataStrategy(request)
      }
      return navigationStrategy(request)
    }

    function onMessage(event) {
      var data = event.data
      if (!data || typeof data !== 'object' || data.schemaVersion !== 1) {
        postError(event.source, 'INVALID_MESSAGE')
        return
      }

      function wait(promise) {
        if (event.waitUntil && promise) {
          event.waitUntil(promise)
        }
      }

      switch (data.type) {
        case 'MATH_ASSIST_INSTALL_GRADE_PACK':
          if (!isValidGrade(data.grade)) {
            postError(event.source, 'INVALID_GRADE')
            return
          }
          wait(installGradePack(data.grade, event.source))
          break
        case 'MATH_ASSIST_REMOVE_GRADE_PACK':
          if (!isValidGrade(data.grade)) {
            postError(event.source, 'INVALID_GRADE')
            return
          }
          wait(removeGradePack(data.grade, event.source))
          break
        case 'MATH_ASSIST_QUERY_OFFLINE_STATE':
          wait(
            computeState()
              .catch(function () {
                return { schemaVersion: 1, type: 'MATH_ASSIST_OFFLINE_ERROR', code: 'METADATA_UNAVAILABLE' }
              })
              .then(function (message) {
                postToSource(event.source, message)
              })
          )
          break
        case 'MATH_ASSIST_ACTIVATE_UPDATE':
          if (env.registration && typeof env.registration.skipWaiting === 'function') {
            wait(env.registration.skipWaiting())
          }
          break
        default:
          postError(event.source, 'UNKNOWN_MESSAGE')
      }
    }

    return {
      loadMetadata: loadMetadata,
      computeState: computeState,
      handleInstall: function (event) {
        var work = handleInstallWork()
        if (event && event.waitUntil) {
          event.waitUntil(work)
        }
        return work
      },
      handleActivate: function (event) {
        var work = handleActivateWork()
        if (event && event.waitUntil) {
          event.waitUntil(work)
        }
        return work
      },
      handleFetch: function (event) {
        return onFetch(event)
      },
      handleMessage: function (event) {
        onMessage(event)
      }
    }
  }

  var api = {
    createCore: createCore,
    SHELL_PATHS: SHELL_PATHS,
    FIXED_ERROR_CODES: FIXED_ERROR_CODES
  }

  function wire(target) {
    var core = createCore({
      caches: target.caches,
      fetch: function (input, init) {
        return fetch(input, init)
      },
      clients: target.clients,
      registration: target.registration
    })
    target.addEventListener('install', function (event) {
      core.handleInstall(event)
    })
    target.addEventListener('activate', function (event) {
      core.handleActivate(event)
    })
    target.addEventListener('fetch', function (event) {
      var handled = core.handleFetch(event)
      if (handled && typeof event.respondWith === 'function') {
        event.respondWith(handled)
      }
    })
    target.addEventListener('message', function (event) {
      core.handleMessage(event)
    })
  }

  api.wire = wire

  if (
    typeof importScripts === 'function' &&
    typeof self !== 'undefined' &&
    self.registration &&
    typeof self.addEventListener === 'function'
  ) {
    wire(self)
  }

  if (typeof self !== 'undefined') {
    self.mathAssistServiceWorker = api
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api
  }
})()
