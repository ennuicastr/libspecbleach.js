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
 * adaptive denoiser processor. It expects raw float data as input and produces
 * the same as output.
 *
 * This was adapted to JavaScript from denoiser_demo.c
 */

const fs = require("fs");
const LibSpecBleach = require("../libspecbleach.js");

// This is not a deliberate value. The library handles any amount passed through
// a circular buffer
const BLOCK_SIZE = 512;

async function main(argc, argv) {
  if (argc != 3) {
    console.error("usage: adenoiser_demo.js <noisy input> <denoised output>");
    process.exit(1);
  }

  const input_file_name = argv[1];
  const output_file_name = argv[2];

  const input_file = new Float32Array(fs.readFileSync(input_file_name).buffer);
  let input_file_idx = 0;
  const output_file = fs.createWriteStream(output_file_name);

  const specbleach = await LibSpecBleach.LibSpecBleach();
  const SpecBleach = new specbleach.SpecBleach({
    adaptive: true,
    block_size: BLOCK_SIZE
  });

  while (input_file_idx < input_file.length - BLOCK_SIZE) {
    output_file.write(Buffer.from(
      SpecBleach.process(input_file.subarray(input_file_idx, input_file_idx + BLOCK_SIZE)).buffer
    ));
    input_file_idx += BLOCK_SIZE;
  }
}

main(process.argv.length - 1, process.argv.slice(1));
