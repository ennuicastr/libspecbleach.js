@FUNCS

Module.calloc_f32 = function(nmemb) {
    var ret_ptr = calloc(nmemb, 4);
    if (!ret_ptr)
        return null;
    var ret = ret_ptr >> 2;
    return [ret_ptr, Module.HEAPF32.subarray(ret, ret + nmemb)];
}
