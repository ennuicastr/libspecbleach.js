CC=emcc
CFLAGS=-Oz

FFTW3_VERSION=3.3.10
FFTW3=fftw-$(FFTW3_VERSION)/build/.libs/libfftw3f.a

EFLAGS=\
	--memory-init-file 0 --post-js post.js \
	-s "EXPORT_NAME='LibSpecBleach'" \
	-s "EXPORTED_FUNCTIONS=@exports.json" \
	-s "EXPORTED_RUNTIME_METHODS=['cwrap']" \
	-s MODULARIZE=1

CFLAGS=-Oz

OBJS=\
	bindings.o \
	src/shared/utils/general_utils.o \
	src/shared/utils/denoise_mixer.o \
	src/shared/utils/spectral_features.o \
	src/shared/utils/spectral_utils.o \
	src/shared/utils/spectral_trailing_buffer.o \
	src/shared/pre_estimation/absolute_hearing_thresholds.o \
	src/shared/pre_estimation/masking_estimator.o \
	src/shared/pre_estimation/noise_scaling_criterias.o \
	src/shared/pre_estimation/transient_detector.o \
	src/shared/pre_estimation/spectral_smoother.o \
	src/shared/post_estimation/spectral_whitening.o \
	src/shared/post_estimation/postfilter.o \
	src/shared/noise_estimation/adaptive_noise_estimator.o \
	src/shared/noise_estimation/noise_estimator.o \
	src/shared/noise_estimation/noise_profile.o \
	src/shared/gain_estimation/gain_estimators.o \
	src/shared/pre_estimation/critical_bands.o \
	src/shared/stft/fft_transform.o \
	src/shared/stft/stft_windows.o \
	src/shared/stft/stft_buffer.o \
	src/shared/stft/stft_processor.o \
	src/processors/denoiser/spectral_denoiser.o \
	src/processors/adaptivedenoiser/adaptive_denoiser.o \
	src/processors/specbleach_adenoiser.o \
	src/processors/specbleach_denoiser.o \

all: libspecbleach.asm.js libspecbleach.wasm.js \
	libspecbleach.types.d.ts

libspecbleach.asm.js: $(OBJS) post.js
	$(CC) $(CFLAGS) $(EFLAGS) -s WASM=0 \
		$(OBJS) $(FFTW3) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@

libspecbleach.wasm.js: $(OBJS) post.js
	$(CC) $(CFLAGS) $(EFLAGS) \
		$(OBJS) $(FFTW3) -o $@
	cat license.js $@ > $@.tmp
	mv $@.tmp $@
	chmod a-x libspecbleach.wasm.wasm

%.o: %.c $(FFTW3)
	$(CC) $(CFLAGS) -Iinclude -Ifftw-$(FFTW3_VERSION)/api -c $< -o $@

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

halfclean:
	rm -f libspecbleach.asm.js libspecbleach.wasm.js libspecbleach.wasm.wasm
	rm -f $(OBJS)
	rm -f exports.json post.js libspecbleach.types.d.ts

clean: halfclean
	rm -rf fftw-$(FFTW3_VERSION)
