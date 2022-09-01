CC=emcc
CFLAGS=-Oz

FFTW3_VERSION=3.3.10
FFTW3=fftw-$(FFTW3_VERSION)/build/.libs/libfftw3f.a
FFTW3_SIMD=fftw-$(FFTW3_VERSION)/build-simd/.libs/libfftw3f.a

EFLAGS=\
	--memory-init-file 0 --post-js post.js \
	-s "EXPORT_NAME='LibSpecBleachFactory'" \
	-s "EXPORTED_FUNCTIONS=@exports.json" \
	-s "EXPORTED_RUNTIME_METHODS=['cwrap']" \
	-s MODULARIZE=1

CFLAGS=-Oz

SRC=\
	bindings.c abindings.c \
	src/shared/utils/general_utils.c \
	src/shared/utils/denoise_mixer.c \
	src/shared/utils/spectral_features.c \
	src/shared/utils/spectral_utils.c \
	src/shared/utils/spectral_trailing_buffer.c \
	src/shared/pre_estimation/absolute_hearing_thresholds.c \
	src/shared/pre_estimation/masking_estimator.c \
	src/shared/pre_estimation/noise_scaling_criterias.c \
	src/shared/pre_estimation/transient_detector.c \
	src/shared/pre_estimation/spectral_smoother.c \
	src/shared/post_estimation/spectral_whitening.c \
	src/shared/post_estimation/postfilter.c \
	src/shared/noise_estimation/adaptive_noise_estimator.c \
	src/shared/noise_estimation/noise_estimator.c \
	src/shared/noise_estimation/noise_profile.c \
	src/shared/gain_estimation/gain_estimators.c \
	src/shared/pre_estimation/critical_bands.c \
	src/shared/stft/fft_transform.c \
	src/shared/stft/stft_windows.c \
	src/shared/stft/stft_buffer.c \
	src/shared/stft/stft_processor.c \
	src/processors/denoiser/spectral_denoiser.c \
	src/processors/adaptivedenoiser/adaptive_denoiser.c \
	src/processors/specbleach_adenoiser.c \
	src/processors/specbleach_denoiser.c

OBJS=$(addprefix build/,$(SRC:.c=.o))

OBJS_SIMD=$(addprefix build-simd/,$(SRC:.c=.o))

all: libspecbleach.asm.js libspecbleach.wasm.js libspecbleach.simd.js \
	libspecbleach.types.d.ts

libspecbleach.asm.js: $(OBJS) $(FFTW3) post.js
	$(CC) $(CFLAGS) $(EFLAGS) -s WASM=0 \
		$(OBJS) $(FFTW3) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@

libspecbleach.wasm.js: $(OBJS) $(FFTW3) post.js
	$(CC) $(CFLAGS) $(EFLAGS) \
		$(OBJS) $(FFTW3) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@
	chmod a-x libspecbleach.wasm.wasm

libspecbleach.simd.js: $(OBJS_SIMD) $(FFTW3_SIMD) post.js
	$(CC) $(CFLAGS) -msimd128 $(EFLAGS) \
		$(OBJS_SIMD) $(FFTW3_SIMD) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@
	chmod a-x libspecbleach.simd.wasm

build/%.o: %.c $(FFTW3)
	mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -Iinclude -Ifftw-$(FFTW3_VERSION)/api -c $< -o $@

build-simd/%.o: %.c $(FFTW3_SIMD)
	mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -msimd128 -Iinclude -Ifftw-$(FFTW3_VERSION)/api -c $< -o $@

exports.json: funcs.json apply-funcs.js post.in.js libspecbleach.types.in.d.ts
	./apply-funcs.js

post.js: exports.json
	touch $@

libspecbleach.types.d.ts: exports.json
	touch $@

$(FFTW3):
	test -e fftw-$(FFTW3_VERSION).tar.gz || wget http://www.fftw.org/fftw-$(FFTW3_VERSION).tar.gz
	test -e fftw-$(FFTW3_VERSION)/configure || tar zxf fftw-$(FFTW3_VERSION).tar.gz
	test -e fftw-$(FFTW3_VERSION)/build/Makefile || ( \
		mkdir -p fftw-$(FFTW3_VERSION)/build ; \
		cd fftw-$(FFTW3_VERSION)/build ; \
		emconfigure ../configure --prefix=/usr --enable-float CFLAGS=-Oz \
	)
	cd fftw-$(FFTW3_VERSION)/build ; $(MAKE)

$(FFTW3_SIMD): $(FFTW3)
	test -e fftw-$(FFTW3_VERSION)/build-simd/Makefile || ( \
		mkdir -p fftw-$(FFTW3_VERSION)/build-simd ; \
		cd fftw-$(FFTW3_VERSION)/build-simd ; \
		emconfigure ../configure --prefix=/urs --enable-float \
			--enable-generic-simd128 CFLAGS="-Oz -msimd128" \
	)
	cd fftw-$(FFTW3_VERSION)/build-simd ; $(MAKE)

halfclean:
	rm -f libspecbleach.asm.js \
		libspecbleach.wasm.js libspecbleach.wasm.wasm \
		libspecbleach.simd.js libspecbleach.simd.wasm
	rm -rf build build-simd
	rm -f exports.json post.js libspecbleach.types.d.ts

clean: halfclean
	rm -rf fftw-$(FFTW3_VERSION)
