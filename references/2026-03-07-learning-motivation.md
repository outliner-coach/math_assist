# 2026-03-07 Learning Motivation Benchmarks

## Purpose

Collect benchmark examples and learning-science evidence for improving self-directed study, motivation, and persistence in the elementary math app.

## Sources

1. IXL Diagnostic  
   Link: https://www.ixl.com/diagnostic

2. Khan Academy Kids  
   Link: https://learn.khanacademy.org/khan-academy-kids/

3. Prodigy for Parents  
   Link: https://www.prodigygame.com/main-en/parents/

4. Education Endowment Foundation - Metacognition and Self-regulation  
   Link: https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation

5. Education Endowment Foundation - Feedback  
   Link: https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback

6. Self-Determination Theory - Basic Psychological Needs  
   Link: https://selfdeterminationtheory.org/topics/application-basic-psychological-needs/

7. Worked Example Effect for Novices  
   Link: https://www.sciencedirect.com/science/article/pii/S0361476X1000055X

## What we learned

### Product patterns

- IXL pushes learners from diagnosis to a concrete action plan. The important pattern is not the score itself, but the immediate next recommendation.
- Khan Academy Kids emphasizes an adaptive path so children can continue without deciding everything from scratch each time.
- Prodigy uses game framing, reward loops, and parent-facing visibility to keep children returning even when the work is still math practice.

### Learning-science patterns

- Metacognition and self-regulation work best when learners set a goal, monitor progress, and reflect after practice.
- Feedback is strongest when it is specific and directly tied to the next action, not just a correctness label.
- Self-determination theory highlights three motivational needs: autonomy, competence, and relatedness.
- For novices, worked examples often outperform unguided problem solving at the start of learning.

## Implications for Math Assist

1. Replace score-first result screens with action-first result screens.
   Show a short diagnosis such as "you are strong at X" and "you need one more step on Y", then recommend the next activity.

2. Add lightweight mastery states per concept.
   Suggested labels: `처음`, `연습 중`, `거의 익힘`, `마스터`.

3. Keep learner choice, but guide it.
   Internally keep set IDs `A/B/C`, but present them as learner-facing labels such as `가볍게 시작`, `실력 올리기`, `마스터 도전`.

4. Add a worked-example ladder.
   Suggested sequence: solved example -> partially guided example -> independent problem set.

5. Reward productive behavior, not only high scores.
   Good triggers include completing a set, retrying wrong answers, using hints productively, and returning for review.

6. Add small planning and reflection prompts.
   Example prompts: `오늘은 무엇을 연습할까?`, `어느 단계에서 헷갈렸을까?`, `다음에는 무엇을 먼저 볼까?`

7. Consider a light caregiver summary later.
   A small weekly summary can reinforce relatedness without turning the app into a parent dashboard.

## Open questions

- How visible should rewards be before they distract from the core math flow?
- Should mastery be stored at concept level only, or also by sub-skill and error type?
- Should the first release of motivation features focus on retry loops or on mastery maps?
