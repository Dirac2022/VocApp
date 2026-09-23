.PHONY: serve compile test

serve:
	cd mobile && npx expo start

compile:
	cd mobile && npx tsc --noEmit

test:
	cd mobile && npx jest