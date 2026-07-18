# Grade 5 geometry reference extraction

Source reviewed: `KakaoTalk_Photo_2026-07-18-21-17-02.jpeg`, supplied by the user on 2026-07-18.

The photographed worksheet raises difficulty through structure rather than larger numbers:

- rectangle and square chains where a total area is given and a missing length must be recovered
- concave L-shapes where inner and outer edges must both be reasoned about
- equal rectangles joined with an overlap, requiring recovery of one sheet's dimensions or area
- shaded regions formed by splitting or moving triangles and parallelograms
- three overlapping shapes where exclusive, pairwise-overlap, and triple-overlap regions are counted differently

Implementation interpretation:

- retain four foundational items in each 10-question set
- use four multi-step representation items in the middle
- require two applied items that combine at least two relationships
- render only values stated in the prompt; never place a derived answer in the SVG
- vary context and requested quantity across sets A, B, and C instead of only changing numbers
