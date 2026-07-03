DOCKER_IMAGE ?= zmkfirmware/zmk-build-arm:stable
BUILD_ROOT := .docker-build
CACHE_ROOT := /tmp/opencode/urchin-zephyr-cache-v2
DOCKER_RUN = docker run --rm --user $$(id -u):$$(id -g) -v "$(CURDIR)":/workspaces/zmk-config -v "$(CACHE_ROOT)":/workspaces/zmk-config/zephyr/.cache -w /workspaces/zmk-config -e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0='*' $(DOCKER_IMAGE)

LEFT_BUILD := $(BUILD_ROOT)/urchin_left
RIGHT_BUILD := $(BUILD_ROOT)/urchin_right
ZEPHYR_DIR := /workspaces/zmk-config/zephyr/share/zephyr-package/cmake

.PHONY: svg left right uf2 firmware clean

svg:
	node scripts/generate-keymap-svgs.mjs

$(BUILD_ROOT):
	mkdir -p "$(BUILD_ROOT)"

$(CACHE_ROOT)/ToolchainCapabilityDatabase:
	mkdir -p "$(CACHE_ROOT)/ToolchainCapabilityDatabase"

left: $(BUILD_ROOT) $(CACHE_ROOT)/ToolchainCapabilityDatabase
	$(DOCKER_RUN) west build -s zmk/app -d $(LEFT_BUILD) -b nice_nano_v2 -S studio-rpc-usb-uart -- -DZMK_CONFIG=/workspaces/zmk-config/config -DSHIELD="urchin_left nice_view_adapter nice_view_gem" -DCONFIG_ZMK_STUDIO=y -DZephyr_DIR=$(ZEPHYR_DIR)

right: $(BUILD_ROOT) $(CACHE_ROOT)/ToolchainCapabilityDatabase
	$(DOCKER_RUN) west build -s zmk/app -d $(RIGHT_BUILD) -b nice_nano_v2 -- -DZMK_CONFIG=/workspaces/zmk-config/config -DSHIELD="urchin_right nice_view_adapter nice_view_gem" -DZephyr_DIR=$(ZEPHYR_DIR)


uf2:
	$(MAKE) -j2 left right
	cp "$(BUILD_ROOT)/urchin_left/zephyr/zmk.uf2" "urchin_left.uf2"
	cp "$(BUILD_ROOT)/urchin_right/zephyr/zmk.uf2" "urchin_right.uf2"

firmware: svg uf2

clean:
	rm -rf "$(BUILD_ROOT)"
