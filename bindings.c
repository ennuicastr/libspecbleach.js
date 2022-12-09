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

#include <stdbool.h>
#include <stdlib.h>

#include "specbleach_denoiser.h"

#define A(struc, type, field) \
    type struc ## _ ## field(struc *a) { return a->field; } \
    void struc ## _ ## field ## _s(struc *a, type b) { a->field = b; }

/*******************************************************************************
 * specbleach_denoiser
 ******************************************************************************/
#define B(type, field) A(SpectralBleachParameters, type, field)
B(int, learn_noise)
B(bool, residual_listen)
B(float, reduction_amount)
B(float, smoothing_factor)
B(bool, transient_protection)
B(float, whitening_factor)
B(int, noise_scaling_type)
B(float, noise_rescale)
B(float, post_filter_threshold)
#undef A

SpectralBleachParameters *specbleach_malloc_parameters_js() {
    SpectralBleachParameters *ret = calloc(1, sizeof(SpectralBleachParameters));
    if (!ret)
        return ret;

    // Sane defaults from the example
    ret->reduction_amount = 10;
    ret->noise_rescale = 2;
    ret->post_filter_threshold = -10;
    return ret;
}

bool specbleach_load_parameters_js(SpectralBleachHandle instance,
                                   SpectralBleachParameters *parameters) {
    return specbleach_load_parameters(instance, *parameters);
}
