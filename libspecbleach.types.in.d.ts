/*
 * Copyright (C) 2022 Yahweasel
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * The main LibSpecBleach interface, returned as a promise from
 * LibSpecBleach.LibSpecBleach().
 */
export interface LibSpecBleach {
@FUNCS
@DECLS

    /**
     * Allocate an OO interface.
     * @param params  Parameters to use in the creation of the LibSpecBleachOO
     *                instance.
     */
    SpecBleach: new (params?: LibSpecBleachOOParams) => LibSpecBleachOO;

    /**
     * Allocate an F32 array. Returns [pointer, Float32Array]
     * @param nmemb  Size of the array, in floats
     */
    calloc_f32: (nmemb: number) => [number, Float32Array];
}

/**
 * The LibSpecBleach wrapper, exposed with the name "LibSpecBleach".
 */
export interface LibSpecBleachWrapper {
    /**
     * URL base from which load modules.
     */
    base?: string;

    /**
     * Set to avoid loading WebAssembly.
     */
    nowasm?: boolean;

    /**
     * Set to avoid loading WebAssembly SIMD.
     */
    nosimd?: boolean;

    /**
     * Create a LibSpecBleach instance.
     * @param opts  Options
     */
    LibSpecBleach(): Promise<LibSpecBleach>;
}

/**
 * The OO interface to libspecbleach.js
 */
export interface LibSpecBleachOO {
    /**
     * Process this block of input
     * @param input  Input to process
     * @param output  Optional buffer to store the output. If used, this
     *                function performs no allocation.
     */
    process: (input: Float32Array, output?: Float32Array) => Float32Array;

    /**
     * Set the learn_noise parameter as specified. This is separated so that
     * you can easily switch out of learning mode.
     * @param to  Value to set learn_noise to
     */
    set_learn_noise: (to: number) => void;

    /**
     * Free data. DO NOT USE AFTER CALLING THIS. Allowing the surrounding
     * module to go out of scope will have the same effect, but if multiple
     * instances use the same module, this is necessary.
     */
    free: () => void;

    /**
     * Internal pointer to the input buffer.
     */
    input_buffer_ptr: number;

    /**
     * The input buffer. In most circumstances, you don't need to directly use
     * this.
     */
    input_buffer: Float32Array;

    /**
     * Internal pointer to the output buffer.
     */
    output_buffer_ptr: number;

    /**
     * The output buffer. In most circumstances, you don't need to directly use
     * this.
     */
    output_buffer: Float32Array;

    /**
     * Sample rate set during initialization.
     */
    sample_rate: number;

    /**
     * Pointer to the instance of the library. You shouldn't need to touch this.
     */
    lib_instance: number;

    /**
     * Pointer to the parameters structure. You can use this to change
     * parameters other than learn_noise.
     */
    parameters: number;
}

/**
 * Parameters to the OO interface.
 */
export interface LibSpecBleachOOParams {
    /**
     * Adaptive mode?
     */
    adaptive?: boolean;

    /**
     * Size (in words) of each block
     */
    block_size?: number;

    /**
     * Sample rate of the input
     */
    sample_rate?: number;

    // Parameters directly in SpecBleachParameters:
    learn_noise?: number;
    residual_listen?: boolean;
    reduction_amount?: number;
    smoothing_factor?: number;
    transient_protection?: boolean;
    whitening_factor?: number;
    noise_rescale?: number;
}
