NOTE: This is a port of libspecbleach to WebAssembly/JavaScript, not the
original libspecbleach!


libspecbleach.js
----------------
Load either `libspecbleach.wasm.js` or `libspecbleach.asm.js`. It exposes a
global variable `LibSpecBleach`. `LibSpecBleach` is a factory function that
returns a promise that resolves to an instance of the SpecBleach library.

The result of `LibSpecBleach()` can be used exactly like the C `libspecbleach`
library. Use `specbleach.calloc_f32(size)` to allocate a `Float32Array` in the
context of the LibSpecBleach instance; it returns an array with the pointer
(needed for C function calls) and the `Float32Array`. Make sure to use
`specbleach.free` to free it when you're done. Otherwise, the library is
identical to the original libspecbleach, except (a) functions that take
`SpecBleachParameter`s instead have versions suffixed with `_js` that take
`SpecBleachParameter *`s, and (b) the `specbleach_` prefix is removed from all
functions, except for `specbleach_free`.

Alternatively, libspecbleach.js has an object oriented API.

See `examples/denoise_demo.js` and `examples/adenoise_demo.js` for examples of
the C API. See `examples/denoise_demo_oo.js` and `examples/adenoise_demo_oo.js`
for examples of the OO API.

The remainder of this document is the original `noise-repellent`'s README, and
is not JavaScript-specific.


# libspecbleach

C library for audio noise reduction and other spectral effects

[![build](https://github.com/lucianodato/libspecbleach/actions/workflows/build.yml/badge.svg)](https://github.com/lucianodato/libspecbleach/actions/workflows/build.yml)

## Background

This library is based on the algorithms that were used in [noise-repellent](https://github.com/lucianodato/noise-repellent). These were extracted into a this standalone library to remove the lv2 dependency. It was design to be extensible and modular. It uses the concept of a spectral processor which itself uses a short time Fourier transform (STFT) to process the audio. There are two initial processors in place, one which uses the adaptive part of noise repellent and one that uses the manual capturing profile based denoising. The library could be extended with more spectral processors using any STFT-based algorithm such as de-crackle, de-click and other audio restoration algorithms.

## De-noise algorithms

There several techniques implemented in the library that are being used in the denoisers, such as masking thresholds estimation, onset detectors, etc. All these are being used in conjunction to improve the very basic spectral substraction algorithm. Most of the papers used are listed in the wiki of the project. Also a block diagram is provided to explain the reduction architecture.

## Build

If you wish to compile yourself and install the library you will need the a C compiling toolchain, Meson build system, ninja compiler, git and fftw3 library.

Installation:

```bash
  git clone https://github.com/lucianodato/noise-repellent.git
  cd noise-repellent
  meson build --buildtype=release --prefix=/usr --libdir=lib (your-os-appropriate-location-fullpath)
  meson compile -C build -v
  sudo meson install -C build
```

## Example

Simple console apps examples are provided to demonstrate how to use the library. It needs libsndfile to compile successfully. You can use them as follows:

Adaptive noise learn

```bash
  adenoise_demo <input file name> <output file name>
```

Manual noise learn

```bash
  denoise_demo <input file name> <output file name>
```

It will recognize any libsndfile supported format.
