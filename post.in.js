@FUNCS

Module.calloc_f32 = function(nmemb) {
    var ret_ptr = calloc(nmemb, 4);
    if (!ret_ptr)
        return null;
    var ret = ret_ptr >> 2;
    return [ret_ptr, Module.HEAPF32.subarray(ret, ret + nmemb)];
}

// Object oriented interface
Module.SpecBleach = function(params) {
    params = params || {};

    // Adaptive?
    var adaptive = this.adaptive = !!params.adaptive;

    // Allocate the buffers
    var block_size = params.block_size || 512;
    var input_buffer = Module.calloc_f32(block_size);
    this.input_buffer_ptr = input_buffer[0];
    this.input_buffer = input_buffer[1];
    var output_buffer = Module.calloc_f32(block_size);
    this.output_buffer_ptr = output_buffer[0];
    this.output_buffer = output_buffer[1];

    // Allocate the instance
    var sample_rate = this.sample_rate = params.sample_rate || 48000;
    var lib_instance = this.lib_instance = adaptive ?
        Module.adaptive_initialize(sample_rate) :
        Module.initialize(sample_rate);

    // Allocate the parameters
    var parameters = this.parameters = adaptive ?
        Module.adaptive_malloc_parameters_js() :
        Module.malloc_parameters_js();

    // Set them up
    var parts = [
        ["learn_noise", false],
        ["residual_listen", true],
        ["reduction_amount", true],
        ["smoothing_factor", true],
        ["transient_protection", false],
        ["whitening_factor", false],
        ["noise_rescale", true]
    ];
    var i;
    for (i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (adaptive && !part[1])
            continue;
        if (parts[0] in params) {
            var value = params[parts[0]];
            if (typeof value !== "number")
                value = ~~value;
            Module[
                (adaptive ? "Adaptive" : "") +
                "SpecBleachParameters_" +
                parts[0] +
                "_s"
            ](parameters, value);
        }
    }

    // Load them in
    if (adaptive)
        Module.adaptive_load_parameters_js(lib_instance, parameters);
    else
        Module.load_parameters_js(lib_instance, parameters);
}

// Process this data. Data must be a Float32Array of the correct size.
Module.SpecBleach.prototype.process = function(input) {
    this.input_buffer.set(input);
    var ret;
    if (this.adaptive) {
        ret = Module.adaptive_process(this.lib_instance,
            this.input_buffer.length, this.input_buffer_ptr,
            this.output_buffer_ptr);
    } else {
        ret = Module.process(this.lib_instance, this.input_buffer.length,
            this.input_buffer_ptr, this.output_buffer_ptr);
    }
    if (!ret)
        return null;
    return this.output_buffer.slice(0);
}

/* Set the learn_noise parameter. This is specifically separated so that you
 * can switch from learning to non-learning. This will not work if you attempt
 * to use it on an adaptive instance. */
Module.SpecBleach.prototype.set_learn_noise = function(to) {
    Module.SpectralBleachParameters_learn_noise_s(this.parameters, to);
    Module.load_parameters_js(this.lib_instance, this.parameters);
}

/* Free data. DO NOT USE AFTER CALLING THIS. Allowing the surrounding module to
 * go out of scope will have the same effect, but if multiple instances use the
 * same module, this is necessary. */
Module.SpecBleach.prototype.free = function() {
    if (this.adaptive)
        Module.adaptive_free(this.lib_instance);
    else
        Module.specbleach_free(this.lib_instance);
    Module.free(this.parameters);
    Module.free(this.input_buffer_ptr);
    Module.free(this.output_buffer_ptr);
}
