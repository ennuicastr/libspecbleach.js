CC=emcc
CFLAGS=-Oz

# Attempt to follow libspecbleach upstream version numbers
LIBSPECBLEACHJS_VERSION=0.1.7-js1

FFTW3_VERSION=3.3.10
FFTW3=build/fftw-$(FFTW3_VERSION)/build/.libs/libfftw3f.a
FFTW3_SIMD=build/fftw-$(FFTW3_VERSION)/build-simd/.libs/libfftw3f.a

EFLAGS=\
	--memory-init-file 0 --post-js build/post.js \
	-s "EXPORT_NAME='LibSpecBleachFactory'" \
	-s "EXPORTED_FUNCTIONS=@build/exports.json" \
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

OBJS=$(addprefix build/build-wasm/,$(SRC:.c=.o))

OBJS_SIMD=$(addprefix build/build-simd/,$(SRC:.c=.o))

all: dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).js \
	dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).asm.js \
	dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).wasm.js \
	dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).simd.js \
	dist/libspecbleach.types.d.ts

all: $(EXES)

dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).js: libspecbleach.in.js \
		node_modules/.bin/uglifyjs
	mkdir -p dist
	sed 's/@VER/$(LIBSPECBLEACHJS_VERSION)/g' $< | \
		node_modules/.bin/uglifyjs -m > $@

dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).asm.js: $(OBJS) $(FFTW3) \
		build/exports.json
	mkdir -p dist
	$(CC) $(CFLAGS) $(EFLAGS) -s WASM=0 \
		$(OBJS) $(FFTW3) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@

dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).wasm.js: $(OBJS) $(FFTW3) \
		build/exports.json
	mkdir -p dist
	$(CC) $(CFLAGS) $(EFLAGS) \
		$(OBJS) $(FFTW3) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@
	chmod a-x dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).wasm.wasm

dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).simd.js: $(OBJS_SIMD) \
		$(FFTW3_SIMD) build/exports.json
	mkdir -p dist
	$(CC) $(CFLAGS) -msimd128 $(EFLAGS) \
		$(OBJS_SIMD) $(FFTW3_SIMD) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@
	chmod a-x dist/libspecbleach-$(LIBSPECBLEACHJS_VERSION).simd.wasm

build/build-wasm/%.o: %.c $(FFTW3)
	mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -Iinclude -Ibuild/fftw-$(FFTW3_VERSION)/api -c $< -o $@

build/build-simd/%.o: %.c $(FFTW3_SIMD)
	mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -msimd128 -Iinclude -Ibuild/fftw-$(FFTW3_VERSION)/api -c $< -o $@

build/exports.json: funcs.json apply-funcs.js post.in.js libspecbleach.types.in.d.ts
	mkdir -p build
	mkdir -p dist
	./apply-funcs.js

build/post.js: build/exports.json
	touch $@

dist/libspecbleach.types.d.ts: build/exports.json
	touch $@

node_modules/.bin/uglifyjs:
	npm install

$(FFTW3):
	test -e build/fftw-$(FFTW3_VERSION).tar.gz || ( \
		mkdir -p build ; \
		curl http://www.fftw.org/fftw-$(FFTW3_VERSION).tar.gz \
			-o build/fftw-$(FFTW3_VERSION).tar.gz \
	)
	test -e build/fftw-$(FFTW3_VERSION)/configure || ( \
		cd build ; \
		tar zxf fftw-$(FFTW3_VERSION).tar.gz \
	)
	test -e build/fftw-$(FFTW3_VERSION)/build/Makefile || ( \
		mkdir -p build/fftw-$(FFTW3_VERSION)/build ; \
		cd build/fftw-$(FFTW3_VERSION)/build ; \
		emconfigure ../configure --prefix=/usr --enable-float CFLAGS=-Oz \
	)
	cd build/fftw-$(FFTW3_VERSION)/build && $(MAKE)

$(FFTW3_SIMD): $(FFTW3)
	test -e build/fftw-$(FFTW3_VERSION)/build-simd/Makefile || ( \
		mkdir -p build/fftw-$(FFTW3_VERSION)/build-simd ; \
		cd build/fftw-$(FFTW3_VERSION)/build-simd ; \
		emconfigure ../configure --prefix=/usr --enable-float \
			--enable-generic-simd128 CFLAGS="-Oz -msimd128" \
	)
	cd build/fftw-$(FFTW3_VERSION)/build-simd && $(MAKE)

clean:
	rm -rf dist build/build-wasm build/build-simd build/fftw-$(FFTW3_VERSION)
	rm -f build/exports.json build/post.js

distclean: clean
	rm -rf build
	rm -rf node_modules
	rm -f package-lock.json
