# Change Log

All notable changes to this project will be documented in this file.

## [3.1.0] - 2019-03-14

* Added three new fill styles: **sunburst**, **dashed**, and **zigzag-line**
* Added three new properties in *Options* to support these fill styles:
* **dashOffset** - length of dashes in dashed fill
* **dashGap** - length of gap between dashes in dashed fill
* **zigzagOffset** - width of zigzag triangle when using zigzag-lines fill

Sample of all fill types:

![Rough.js fill examples](https://roughjs.com/images/main/m14.png)

## [4.0.0] - 2020-01-13

* Add optional seeding for randomness to ensure shapes generated with same arguments result in same vectors
* Implemented a new algorithm for hachure generation based on scanlines. Smaller in code size, and about 20% faster
* Algorithm update - adjust shape randomness and curve-step-counts based on the size of the shape
* Removed async/worker builds - can be achieved in the app level, so no need to be in the lib
* Support no-stroke sketching. `stroke: "none"` will not generate outline vectors anymore
* Removed `sunburst` fill style - it had a lot of corner cases where it did not work, and not very popular.
