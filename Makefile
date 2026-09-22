.PHONY: serve compile

serve:
	cd mobile && npx expo start

compile:
	cd mobile && npx tsc --noEmit