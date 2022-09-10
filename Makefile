ASSETS := $(shell yq e '.assets.[].src' manifest.yaml)
ASSET_PATHS := $(addprefix assets/,$(ASSETS))
VERSION := $(shell yq e ".version" manifest.yaml)

# delete the target of a rule if it has changed and its recipe exits with a nonzero exit status
.DELETE_ON_ERROR:

all: verify

install: all
	embassy-cli package install nextcloud.s9pk

verify: nextcloud.s9pk
	embassy-sdk verify s9pk nextcloud.s9pk

clean:
	rm -f image.tar
	rm -f nextcloud.s9pk
	rm -f scripts/*.js

nextcloud.s9pk: manifest.yaml assets/compat/* image.tar docs/instructions.md scripts/embassy.js $(ASSET_PATHS)
	embassy-sdk pack

image.tar: Dockerfile docker_entrypoint.sh assets/utils/*
	DOCKER_CLI_EXPERIMENTAL=enabled docker buildx build --tag start9/nextcloud/main:$(VERSION) --platform=linux/arm64/v8 -o type=docker,dest=image.tar -f ./Dockerfile .

scripts/embassy.js: scripts/**/*.ts
	deno bundle scripts/embassy.ts scripts/embassy.js
