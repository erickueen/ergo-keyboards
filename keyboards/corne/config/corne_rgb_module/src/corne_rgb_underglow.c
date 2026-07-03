/*
 * Copyright (c) 2020 The ZMK Contributors
 *
 * SPDX-License-Identifier: MIT
 */

#include <zephyr/device.h>
#include <zephyr/init.h>
#include <zephyr/kernel.h>
#include <zephyr/settings/settings.h>

#include <math.h>
#include <stdlib.h>

#include <zephyr/logging/log.h>

#include <zephyr/drivers/led_strip.h>
#include <drivers/ext_power.h>

#include <zmk/rgb_underglow.h>

#include <zmk/activity.h>
#include <zmk/battery.h>
#include <zmk/ble.h>
#include <zmk/endpoints.h>
#include <zmk/usb.h>
#include <zmk/event_manager.h>
#include <zmk/events/activity_state_changed.h>
#include <zmk/events/position_state_changed.h>
#include <zmk/events/usb_conn_state_changed.h>
#include <zmk/workqueue.h>

LOG_MODULE_DECLARE(zmk, CONFIG_ZMK_LOG_LEVEL);

#if !DT_HAS_CHOSEN(zmk_underglow)

#error "A zmk,underglow chosen node must be declared"

#endif

#define STRIP_CHOSEN DT_CHOSEN(zmk_underglow)
#define STRIP_NUM_PIXELS DT_PROP(STRIP_CHOSEN, chain_length)

#define HUE_MAX 360
#define SAT_MAX 100
#define BRT_MAX 100
#define STATUS_OVERLAY_DURATION_MS 3000
#define REACTIVE_DURATION_MS 200
#define MAGIC_LAYER_BRIGHTNESS_PCT 10

#define NO_LED_INDEX -1

#if defined(CONFIG_SHIELD_CORNE_LEFT)
#define CORNE_IS_LEFT_HALF 1
#else
#define CORNE_IS_LEFT_HALF 0
#endif

#if defined(CONFIG_SHIELD_CORNE_RIGHT)
#define CORNE_IS_RIGHT_HALF 1
#else
#define CORNE_IS_RIGHT_HALF 0
#endif

BUILD_ASSERT(!(CORNE_IS_LEFT_HALF && CORNE_IS_RIGHT_HALF),
             "Only one Corne half shield can be selected");

BUILD_ASSERT(CONFIG_CORNE_RGB_UNDERGLOW_BRT_MIN <= CONFIG_CORNE_RGB_UNDERGLOW_BRT_MAX,
             "ERROR: RGB underglow maximum brightness is less than minimum brightness");

enum rgb_underglow_effect {
    UNDERGLOW_EFFECT_SOLID,
    UNDERGLOW_EFFECT_BREATHE,
    UNDERGLOW_EFFECT_SPECTRUM,
    UNDERGLOW_EFFECT_SWIRL,
    UNDERGLOW_EFFECT_REACTIVE,
    UNDERGLOW_EFFECT_NUMBER // Used to track number of underglow effects
};

struct rgb_underglow_state {
    struct zmk_led_hsb color;
    uint8_t animation_speed;
    uint8_t current_effect;
    uint16_t animation_step;
    bool on;
};

static const struct device *led_strip;

static struct led_rgb pixels[STRIP_NUM_PIXELS];
static int64_t reactive_until[STRIP_NUM_PIXELS];

struct rgb_status_overlay_state {
    bool active;
    bool restore_rgb_off;
    bool restore_ext_power_off;
    int64_t expires_at;
    uint8_t segments_lit;
    struct led_rgb color;
};

static struct rgb_status_overlay_state status_overlay;
extern struct k_timer underglow_tick;

static const struct led_rgb catppuccin_green = {.r = 0x40, .g = 0xa0, .b = 0x2b};
static const struct led_rgb catppuccin_yellow = {.r = 0xdf, .g = 0x8e, .b = 0x1d};
static const struct led_rgb catppuccin_red = {.r = 0xd2, .g = 0x0f, .b = 0x39};
static const struct led_rgb catppuccin_blue = {.r = 0x1e, .g = 0x66, .b = 0xf5};
#if IS_ENABLED(CONFIG_ZMK_BLE) && IS_ENABLED(CONFIG_ZMK_SPLIT_ROLE_CENTRAL)
static const struct led_rgb catppuccin_mauve = {.r = 0x88, .g = 0x39, .b = 0xef};
static const struct led_rgb catppuccin_lavender = {.r = 0x72, .g = 0x87, .b = 0xfd};
#endif

static struct zmk_led_hsb hsb_scale_min_max(struct zmk_led_hsb hsb);
static struct led_rgb hsb_to_rgb(struct zmk_led_hsb hsb);

static struct led_rgb scale_rgb_brightness(struct led_rgb color, uint8_t pct) {
    return (struct led_rgb){
        .r = (color.r * pct) / 100,
        .g = (color.g * pct) / 100,
        .b = (color.b * pct) / 100,
    };
}

static struct rgb_underglow_state state;

#if CORNE_IS_LEFT_HALF
static const uint8_t status_meter_positions[] = {1, 2, 3, 4, 5, 13, 14, 15, 16, 17};
static const uint8_t usb_status_position = 25;
#if IS_ENABLED(CONFIG_ZMK_BLE) && IS_ENABLED(CONFIG_ZMK_SPLIT_ROLE_CENTRAL)
static const uint8_t bt_status_positions[] = {26, 27, 28, 29};
#endif
#elif CORNE_IS_RIGHT_HALF
static const uint8_t status_meter_positions[] = {6, 7, 8, 9, 10, 18, 19, 20, 21, 22};
static const uint8_t usb_status_position = 34;
#if IS_ENABLED(CONFIG_ZMK_BLE) && IS_ENABLED(CONFIG_ZMK_SPLIT_ROLE_CENTRAL)
static const uint8_t bt_status_positions[] = {33, 32, 31, 30};
#endif
#endif

static int position_to_led_index(uint32_t position) {
#if CORNE_IS_LEFT_HALF
    switch (position) {
    case 38:
        return 6;
    case 29:
        return 7;
    case 17:
        return 8;
    case 5:
        return 9;
    case 4:
        return 10;
    case 16:
        return 11;
    case 28:
        return 12;
    case 37:
        return 13;
    case 36:
        return 14;
    case 27:
        return 15;
    case 15:
        return 16;
    case 3:
        return 17;
    case 2:
        return 18;
    case 14:
        return 19;
    case 26:
        return 20;
    case 25:
        return 21;
    case 13:
        return 22;
    case 1:
        return 23;
    case 0:
        return 24;
    case 12:
        return 25;
    case 24:
        return 26;
    default:
        return NO_LED_INDEX;
    }
#elif CORNE_IS_RIGHT_HALF
    switch (position) {
    case 39:
        return 6;
    case 30:
        return 7;
    case 18:
        return 8;
    case 6:
        return 9;
    case 7:
        return 10;
    case 19:
        return 11;
    case 31:
        return 12;
    case 40:
        return 13;
    case 41:
        return 14;
    case 32:
        return 15;
    case 20:
        return 16;
    case 8:
        return 17;
    case 9:
        return 18;
    case 21:
        return 19;
    case 33:
        return 20;
    case 34:
        return 21;
    case 22:
        return 22;
    case 10:
        return 23;
    case 11:
        return 24;
    case 23:
        return 25;
    case 35:
        return 26;
    default:
        return NO_LED_INDEX;
    }
#else
    ARG_UNUSED(position);
    return NO_LED_INDEX;
#endif
}

static void zmk_rgb_underglow_effect_reactive(void) {
    struct led_rgb reactive_color = hsb_to_rgb(hsb_scale_min_max(state.color));
    int64_t now = k_uptime_get();

    for (int i = 0; i < STRIP_NUM_PIXELS; i++) {
        if (i < 6) {
            pixels[i] = reactive_color;
            continue;
        }

        pixels[i] = (struct led_rgb){.r = 0, .g = 0, .b = 0};

        if (reactive_until[i] > now) {
            pixels[i] = reactive_color;
        }
    }
}

static void apply_status_overlay(int64_t now) {
    if (!status_overlay.active) {
        return;
    }

    if (now >= status_overlay.expires_at) {
        status_overlay.active = false;
        return;
    }

#if !CORNE_IS_LEFT_HALF && !CORNE_IS_RIGHT_HALF
    return;
#endif

    for (int i = 0; i < 10; i++) {
        int led = position_to_led_index(status_meter_positions[i]);
        if (led < 0 || led >= STRIP_NUM_PIXELS) {
            continue;
        }

        if (i < status_overlay.segments_lit) {
            pixels[led] = status_overlay.color;
        } else {
            pixels[led] = (struct led_rgb){.r = 0, .g = 0, .b = 0};
        }
    }

#if IS_ENABLED(CONFIG_ZMK_BLE) && IS_ENABLED(CONFIG_ZMK_SPLIT_ROLE_CENTRAL)
    struct zmk_endpoint_instance preferred_endpoint = zmk_endpoints_selected();
    bool ble_preferred = preferred_endpoint.transport == ZMK_TRANSPORT_BLE;
    int active_profile = ble_preferred ? preferred_endpoint.ble.profile_index : -1;
    int profile_count = ZMK_BLE_PROFILE_COUNT;

    for (int i = 0; i < ARRAY_SIZE(bt_status_positions); i++) {
        int led = position_to_led_index(bt_status_positions[i]);
        if (led < 0 || led >= STRIP_NUM_PIXELS) {
            continue;
        }

        struct led_rgb bt_color;

        if (i == active_profile) {
            bt_color = catppuccin_lavender;
        } else if (i < profile_count && zmk_ble_profile_is_connected(i)) {
            bt_color = catppuccin_green;
        } else if (i < profile_count && zmk_ble_profile_is_open(i)) {
            bt_color = catppuccin_mauve;
        } else {
            bt_color = catppuccin_red;
        }

        pixels[led] = scale_rgb_brightness(bt_color, MAGIC_LAYER_BRIGHTNESS_PCT);
    }
#endif

    int usb_led = position_to_led_index(usb_status_position);
    if (usb_led >= 0 && usb_led < STRIP_NUM_PIXELS) {
        if (zmk_usb_is_powered()) {
            pixels[usb_led] = scale_rgb_brightness(catppuccin_blue, MAGIC_LAYER_BRIGHTNESS_PCT);
        } else {
            pixels[usb_led] = (struct led_rgb){.r = 0, .g = 0, .b = 0};
        }
    }
}

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_EXT_POWER)
static const struct device *const ext_power = DEVICE_DT_GET(DT_INST(0, zmk_ext_power_generic));
#endif

static struct zmk_led_hsb hsb_scale_min_max(struct zmk_led_hsb hsb) {
    hsb.b = CONFIG_CORNE_RGB_UNDERGLOW_BRT_MIN +
            (CONFIG_CORNE_RGB_UNDERGLOW_BRT_MAX - CONFIG_CORNE_RGB_UNDERGLOW_BRT_MIN) * hsb.b / BRT_MAX;
    return hsb;
}

static struct zmk_led_hsb hsb_scale_zero_max(struct zmk_led_hsb hsb) {
    hsb.b = hsb.b * CONFIG_CORNE_RGB_UNDERGLOW_BRT_MAX / BRT_MAX;
    return hsb;
}

static struct led_rgb hsb_to_rgb(struct zmk_led_hsb hsb) {
    float r = 0, g = 0, b = 0;

    uint8_t i = hsb.h / 60;
    float v = hsb.b / ((float)BRT_MAX);
    float s = hsb.s / ((float)SAT_MAX);
    float f = hsb.h / ((float)HUE_MAX) * 6 - i;
    float p = v * (1 - s);
    float q = v * (1 - f * s);
    float t = v * (1 - (1 - f) * s);

    switch (i % 6) {
    case 0:
        r = v;
        g = t;
        b = p;
        break;
    case 1:
        r = q;
        g = v;
        b = p;
        break;
    case 2:
        r = p;
        g = v;
        b = t;
        break;
    case 3:
        r = p;
        g = q;
        b = v;
        break;
    case 4:
        r = t;
        g = p;
        b = v;
        break;
    case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    struct led_rgb rgb = {r : r * 255, g : g * 255, b : b * 255};

    return rgb;
}

static void zmk_rgb_underglow_effect_solid(void) {
    for (int i = 0; i < STRIP_NUM_PIXELS; i++) {
        pixels[i] = hsb_to_rgb(hsb_scale_min_max(state.color));
    }
}

static void zmk_rgb_underglow_effect_breathe(void) {
    for (int i = 0; i < STRIP_NUM_PIXELS; i++) {
        struct zmk_led_hsb hsb = state.color;
        hsb.b = abs(state.animation_step - 1200) / 12;

        pixels[i] = hsb_to_rgb(hsb_scale_zero_max(hsb));
    }

    state.animation_step += state.animation_speed * 10;

    if (state.animation_step > 2400) {
        state.animation_step = 0;
    }
}

static void zmk_rgb_underglow_effect_spectrum(void) {
    for (int i = 0; i < STRIP_NUM_PIXELS; i++) {
        struct zmk_led_hsb hsb = state.color;
        hsb.h = state.animation_step;

        pixels[i] = hsb_to_rgb(hsb_scale_min_max(hsb));
    }

    state.animation_step += state.animation_speed;
    state.animation_step = state.animation_step % HUE_MAX;
}

static void zmk_rgb_underglow_effect_swirl(void) {
    for (int i = 0; i < STRIP_NUM_PIXELS; i++) {
        struct zmk_led_hsb hsb = state.color;
        hsb.h = (HUE_MAX / STRIP_NUM_PIXELS * i + state.animation_step) % HUE_MAX;

        pixels[i] = hsb_to_rgb(hsb_scale_min_max(hsb));
    }

    state.animation_step += state.animation_speed * 2;
    state.animation_step = state.animation_step % HUE_MAX;
}

static void zmk_rgb_underglow_tick(struct k_work *work) {
    int64_t now = k_uptime_get();

    if (status_overlay.active && now >= status_overlay.expires_at) {
        status_overlay.active = false;

        if (status_overlay.restore_rgb_off || status_overlay.restore_ext_power_off) {
            bool restore_rgb_off = status_overlay.restore_rgb_off;
            bool restore_ext_power_off = status_overlay.restore_ext_power_off;

            status_overlay.restore_rgb_off = false;
            status_overlay.restore_ext_power_off = false;

            if (restore_rgb_off) {
                state.on = false;
                k_timer_stop(&underglow_tick);
            }

            for (int i = 0; i < STRIP_NUM_PIXELS; i++) {
                pixels[i] = (struct led_rgb){.r = 0, .g = 0, .b = 0};
            }
            int err = led_strip_update_rgb(led_strip, pixels, STRIP_NUM_PIXELS);
            if (err < 0) {
                LOG_ERR("Failed to update the RGB strip (%d)", err);
            }

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_EXT_POWER)
            if (restore_ext_power_off && ext_power != NULL) {
                int rc = ext_power_disable(ext_power);
                if (rc != 0) {
                    LOG_ERR("Unable to disable EXT_POWER: %d", rc);
                }
            }
#endif

            return;
        }
    }

    if (!state.on) {
        return;
    }

    if (status_overlay.active) {
        for (int i = 0; i < STRIP_NUM_PIXELS; i++) {
            pixels[i] = (struct led_rgb){.r = 0, .g = 0, .b = 0};
        }
        apply_status_overlay(now);
    } else {
    switch (state.current_effect) {
    case UNDERGLOW_EFFECT_SOLID:
        zmk_rgb_underglow_effect_solid();
        break;
    case UNDERGLOW_EFFECT_BREATHE:
        zmk_rgb_underglow_effect_breathe();
        break;
    case UNDERGLOW_EFFECT_SPECTRUM:
        zmk_rgb_underglow_effect_spectrum();
        break;
    case UNDERGLOW_EFFECT_SWIRL:
        zmk_rgb_underglow_effect_swirl();
        break;
    case UNDERGLOW_EFFECT_REACTIVE:
        zmk_rgb_underglow_effect_reactive();
        break;
    }
    }

    int err = led_strip_update_rgb(led_strip, pixels, STRIP_NUM_PIXELS);
    if (err < 0) {
        LOG_ERR("Failed to update the RGB strip (%d)", err);
    }
}

K_WORK_DEFINE(underglow_tick_work, zmk_rgb_underglow_tick);

static void zmk_rgb_underglow_tick_handler(struct k_timer *timer) {
    if (!state.on) {
        return;
    }

    k_work_submit_to_queue(zmk_workqueue_lowprio_work_q(), &underglow_tick_work);
}

K_TIMER_DEFINE(underglow_tick, zmk_rgb_underglow_tick_handler, NULL);

#if IS_ENABLED(CONFIG_SETTINGS)
static int rgb_settings_set(const char *name, size_t len, settings_read_cb read_cb, void *cb_arg) {
    const char *next;
    int rc;

    if (settings_name_steq(name, "state", &next) && !next) {
        if (len != sizeof(state)) {
            return -EINVAL;
        }

        rc = read_cb(cb_arg, &state, sizeof(state));
        if (rc >= 0) {
            if (state.on) {
                k_timer_start(&underglow_tick, K_NO_WAIT, K_MSEC(50));
            }

            return 0;
        }

        return rc;
    }

    return -ENOENT;
}

SETTINGS_STATIC_HANDLER_DEFINE(rgb_underglow, "rgb/underglow", NULL, rgb_settings_set, NULL, NULL);

static void zmk_rgb_underglow_save_state_work(struct k_work *_work) {
    settings_save_one("rgb/underglow/state", &state, sizeof(state));
}

static struct k_work_delayable underglow_save_work;
#endif

static int zmk_rgb_underglow_init(void) {
    led_strip = DEVICE_DT_GET(STRIP_CHOSEN);

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_EXT_POWER)
    if (!device_is_ready(ext_power)) {
        LOG_ERR("External power device \"%s\" is not ready", ext_power->name);
        return -ENODEV;
    }
#endif

    state = (struct rgb_underglow_state){
        color : {
            h : CONFIG_CORNE_RGB_UNDERGLOW_HUE_START,
            s : CONFIG_CORNE_RGB_UNDERGLOW_SAT_START,
            b : CONFIG_CORNE_RGB_UNDERGLOW_BRT_START,
        },
        animation_speed : CONFIG_CORNE_RGB_UNDERGLOW_SPD_START,
        current_effect : CONFIG_CORNE_RGB_UNDERGLOW_EFF_START,
        animation_step : 0,
        on : IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_ON_START)
    };

#if IS_ENABLED(CONFIG_SETTINGS)
    k_work_init_delayable(&underglow_save_work, zmk_rgb_underglow_save_state_work);
#endif

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_AUTO_OFF_USB)
    state.on = zmk_usb_is_powered();
#endif

    if (state.on) {
        k_timer_start(&underglow_tick, K_NO_WAIT, K_MSEC(50));
    }

    return 0;
}

int zmk_rgb_underglow_save_state(void) {
#if IS_ENABLED(CONFIG_SETTINGS)
    int ret = k_work_reschedule(&underglow_save_work, K_MSEC(CONFIG_ZMK_SETTINGS_SAVE_DEBOUNCE));
    return MIN(ret, 0);
#else
    return 0;
#endif
}

int zmk_rgb_underglow_get_state(bool *on_off) {
    if (!led_strip)
        return -ENODEV;

    *on_off = state.on;
    return 0;
}

int zmk_rgb_underglow_on(void) {
    if (!led_strip)
        return -ENODEV;

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_EXT_POWER)
    if (ext_power != NULL) {
        int rc = ext_power_enable(ext_power);
        if (rc != 0) {
            LOG_ERR("Unable to enable EXT_POWER: %d", rc);
        }
    }
#endif

    state.on = true;
    state.animation_step = 0;
    k_timer_start(&underglow_tick, K_NO_WAIT, K_MSEC(50));

    return zmk_rgb_underglow_save_state();
}

static void zmk_rgb_underglow_off_handler(struct k_work *work) {
    for (int i = 0; i < STRIP_NUM_PIXELS; i++) {
        pixels[i] = (struct led_rgb){r : 0, g : 0, b : 0};
    }

    led_strip_update_rgb(led_strip, pixels, STRIP_NUM_PIXELS);
}

K_WORK_DEFINE(underglow_off_work, zmk_rgb_underglow_off_handler);

int zmk_rgb_underglow_off(void) {
    if (!led_strip)
        return -ENODEV;

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_EXT_POWER)
    if (ext_power != NULL) {
        int rc = ext_power_disable(ext_power);
        if (rc != 0) {
            LOG_ERR("Unable to disable EXT_POWER: %d", rc);
        }
    }
#endif

    k_work_submit_to_queue(zmk_workqueue_lowprio_work_q(), &underglow_off_work);

    k_timer_stop(&underglow_tick);
    state.on = false;

    return zmk_rgb_underglow_save_state();
}

int zmk_rgb_underglow_calc_effect(int direction) {
    return (state.current_effect + UNDERGLOW_EFFECT_NUMBER + direction) % UNDERGLOW_EFFECT_NUMBER;
}

int zmk_rgb_underglow_select_effect(int effect) {
    if (!led_strip)
        return -ENODEV;

    if (effect < 0 || effect >= UNDERGLOW_EFFECT_NUMBER) {
        return -EINVAL;
    }

    state.current_effect = effect;
    state.animation_step = 0;

    return zmk_rgb_underglow_save_state();
}

int zmk_rgb_underglow_cycle_effect(int direction) {
    return zmk_rgb_underglow_select_effect(zmk_rgb_underglow_calc_effect(direction));
}

int zmk_rgb_underglow_toggle(void) {
    return state.on ? zmk_rgb_underglow_off() : zmk_rgb_underglow_on();
}

int zmk_rgb_underglow_set_hsb(struct zmk_led_hsb color) {
    if (color.h > HUE_MAX || color.s > SAT_MAX || color.b > BRT_MAX) {
        return -ENOTSUP;
    }

    state.color = color;

    return 0;
}

int zmk_rgb_underglow_show_status(void) {
    if (!led_strip) {
        return -ENODEV;
    }

    bool was_active = status_overlay.active;
    bool was_on = state.on;

    if (!was_active) {
        status_overlay.restore_rgb_off = !was_on;
        status_overlay.restore_ext_power_off = false;

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_EXT_POWER)
        if (ext_power != NULL) {
            int ext_power_state = ext_power_get(ext_power);
            if (ext_power_state < 0) {
                LOG_ERR("Unable to read EXT_POWER: %d", ext_power_state);
                status_overlay.restore_ext_power_off = false;
            } else {
                status_overlay.restore_ext_power_off = ext_power_state == 0;
            }
        }
#else
        status_overlay.restore_ext_power_off = false;
#endif
    }

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_EXT_POWER)
    if (status_overlay.restore_ext_power_off && ext_power != NULL) {
        int rc = ext_power_enable(ext_power);
        if (rc != 0) {
            LOG_ERR("Unable to enable EXT_POWER: %d", rc);
        }
    }
#endif

    uint8_t percent = zmk_battery_state_of_charge();
    uint8_t segments = 0;

    if (percent > 0) {
        segments = (percent + 9) / 10;
    }

    if (percent >= 50) {
        status_overlay.color = catppuccin_green;
    } else if (percent >= 20) {
        status_overlay.color = catppuccin_yellow;
    } else {
        status_overlay.color = catppuccin_red;
    }

    status_overlay.color = scale_rgb_brightness(status_overlay.color, MAGIC_LAYER_BRIGHTNESS_PCT);

    status_overlay.active = true;
    status_overlay.expires_at = k_uptime_get() + STATUS_OVERLAY_DURATION_MS;
    status_overlay.segments_lit = segments;

    if (!was_on) {
        state.on = true;
        k_timer_start(&underglow_tick, K_NO_WAIT, K_MSEC(50));
    }

    k_work_submit_to_queue(zmk_workqueue_lowprio_work_q(), &underglow_tick_work);

    return 0;
}

struct zmk_led_hsb zmk_rgb_underglow_calc_hue(int direction) {
    struct zmk_led_hsb color = state.color;

    color.h += HUE_MAX + (direction * CONFIG_CORNE_RGB_UNDERGLOW_HUE_STEP);
    color.h %= HUE_MAX;

    return color;
}

struct zmk_led_hsb zmk_rgb_underglow_calc_sat(int direction) {
    struct zmk_led_hsb color = state.color;

    int s = color.s + (direction * CONFIG_CORNE_RGB_UNDERGLOW_SAT_STEP);
    if (s < 0) {
        s = 0;
    } else if (s > SAT_MAX) {
        s = SAT_MAX;
    }
    color.s = s;

    return color;
}

struct zmk_led_hsb zmk_rgb_underglow_calc_brt(int direction) {
    struct zmk_led_hsb color = state.color;

    int b = color.b + (direction * CONFIG_CORNE_RGB_UNDERGLOW_BRT_STEP);
    color.b = CLAMP(b, 0, BRT_MAX);

    return color;
}

int zmk_rgb_underglow_change_hue(int direction) {
    if (!led_strip)
        return -ENODEV;

    state.color = zmk_rgb_underglow_calc_hue(direction);

    return zmk_rgb_underglow_save_state();
}

int zmk_rgb_underglow_change_sat(int direction) {
    if (!led_strip)
        return -ENODEV;

    state.color = zmk_rgb_underglow_calc_sat(direction);

    return zmk_rgb_underglow_save_state();
}

int zmk_rgb_underglow_change_brt(int direction) {
    if (!led_strip)
        return -ENODEV;

    state.color = zmk_rgb_underglow_calc_brt(direction);

    return zmk_rgb_underglow_save_state();
}

int zmk_rgb_underglow_change_spd(int direction) {
    if (!led_strip)
        return -ENODEV;

    if (state.animation_speed == 1 && direction < 0) {
        return 0;
    }

    state.animation_speed += direction;

    if (state.animation_speed > 5) {
        state.animation_speed = 5;
    }

    return zmk_rgb_underglow_save_state();
}

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_AUTO_OFF_IDLE) ||                                          \
    IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_AUTO_OFF_USB)
struct rgb_underglow_sleep_state {
    bool is_awake;
    bool rgb_state_before_sleeping;
};

static int rgb_underglow_auto_state(bool target_wake_state) {
    static struct rgb_underglow_sleep_state sleep_state = {
        is_awake : true,
        rgb_state_before_sleeping : false
    };

    // wake up event while awake, or sleep event while sleeping -> no-op
    if (target_wake_state == sleep_state.is_awake) {
        return 0;
    }
    sleep_state.is_awake = target_wake_state;

    if (sleep_state.is_awake) {
        if (sleep_state.rgb_state_before_sleeping) {
            return zmk_rgb_underglow_on();
        } else {
            return zmk_rgb_underglow_off();
        }
    } else {
        sleep_state.rgb_state_before_sleeping = state.on;
        return zmk_rgb_underglow_off();
    }
}
#endif

static int rgb_underglow_event_listener(const zmk_event_t *eh) {

    const struct zmk_position_state_changed *position_event = as_zmk_position_state_changed(eh);
    if (position_event && position_event->state) {
        int led = position_to_led_index(position_event->position);
        if (led >= 0 && led < STRIP_NUM_PIXELS) {
            reactive_until[led] = position_event->timestamp + REACTIVE_DURATION_MS;
        }
        return 0;
    }

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_AUTO_OFF_IDLE)
    if (as_zmk_activity_state_changed(eh)) {
        return rgb_underglow_auto_state(zmk_activity_get_state() == ZMK_ACTIVITY_ACTIVE);
    }
#endif

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_AUTO_OFF_USB)
    if (as_zmk_usb_conn_state_changed(eh)) {
        return rgb_underglow_auto_state(zmk_usb_is_powered());
    }
#endif

    return -ENOTSUP;
}

ZMK_LISTENER(rgb_underglow, rgb_underglow_event_listener);

ZMK_SUBSCRIPTION(rgb_underglow, zmk_position_state_changed);

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_AUTO_OFF_IDLE)
ZMK_SUBSCRIPTION(rgb_underglow, zmk_activity_state_changed);
#endif

#if IS_ENABLED(CONFIG_CORNE_RGB_UNDERGLOW_AUTO_OFF_USB)
ZMK_SUBSCRIPTION(rgb_underglow, zmk_usb_conn_state_changed);
#endif

SYS_INIT(zmk_rgb_underglow_init, APPLICATION, CONFIG_APPLICATION_INIT_PRIORITY);
