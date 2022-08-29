#!/usr/bin/env node
/*
libspecbleach - A spectral processing library

Copyright 2022 Luciano Dato <lucianodato@gmail.com>
Modified example copyright 2022 Yahweasel

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*/

/**
 * This is just a simple console application example using the library with the
 * denoiser processor. It expects raw float data as input and produces the same
 * as output.
 *
 * This was adapted to JavaScript from denoiser_demo.c
 */

const fs = require("fs");
const LibSpecBleach = require("../libspecbleach.wasm.js");

// This is not a deliberate value. The library handles any amount passed through
// a circular buffer
const BLOCK_SIZE = 512;
const NOISE_FRAMES = 8;
    // Amount of frames to capture profile at the beginning of the file (can be
    // anywhere)

async function main(argc, argv) {
  if (argc !== 3) {
    console.error("usage: denoiser_demo.js <noisy input> <denoised output>");
    process.exit(1);
  }

  const input_file_name = argv[1];
  const output_file_name = argv[2];

  const input_file = new Float32Array(fs.readFileSync(input_file_name).buffer);
  let input_file_idx = 0;
  const output_file = fs.createWriteStream(output_file_name);

  const specbleach = await LibSpecBleach();
  const SpecBleach = new specbleach.SpecBleach({
    block_size: BLOCK_SIZE,
    learn_noise: 3
  });

  // NOISE PROFILE LEARN STAGE

  // Iterate over some frames (NOISE_FRAMES) at the beginning of the audio to
  // capture the noise profile
  for (let i = 0; i < NOISE_FRAMES; i++) {
    SpecBleach.process(input_file.subarray(input_file_idx, input_file_idx + BLOCK_SIZE));
    input_file_idx += BLOCK_SIZE;
  }

  // NOISE REDUCTION STAGE

  // Turn off noise profile learn to start applying reduction
  SpecBleach.set_learn_noise(0);

  // Iterate over the audio to apply denoising
  while (input_file_idx < input_file.length - BLOCK_SIZE) {
    // Call to the audio process. Needs to know the number of samples to
    // receive.
    output_file.write(Buffer.from(
      SpecBleach.process(input_file.subarray(input_file_idx, input_file_idx + BLOCK_SIZE)).buffer
    ));
    input_file_idx += BLOCK_SIZE;
  }
}

main(process.argv.length - 1, process.argv.slice(1));
