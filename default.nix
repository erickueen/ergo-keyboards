{ pkgs ? import <nixpkgs> {}
, moergoSrc ? if builtins.pathExists ./src then ./src else builtins.fetchGit {
    url = "https://github.com/moergo-sc/zmk";
    ref = "main";
  }
, firmware ? import moergoSrc {}
, urchinModule ? builtins.fetchGit {
    url = "https://github.com/duckyb/urchin-zmk-module";
    ref = "main";
  }
, niceViewGem ? builtins.fetchGit {
    url = "https://github.com/M165437/nice-view-gem";
    rev = "7794ebf7f75d7e16cb05240bcffe6c5a45ef5b44";
  }
}:

let
  withZmkConfig = drv: configPath: drv.overrideAttrs (old: {
    cmakeFlags = (old.cmakeFlags or []) ++ [ "-DZMK_CONFIG=${configPath}" ];
  });

  go60_left = firmware.zmk.override {
    board = "go60_lh";
    keymap = ./keyboards/go60/config/go60.keymap;
    kconfig = ./keyboards/go60/config/go60.conf;
  };

  go60_right = firmware.zmk.override {
    board = "go60_rh";
    keymap = ./keyboards/go60/config/go60.keymap;
    kconfig = ./keyboards/go60/config/go60.conf;
  };

  go60 = firmware.combine_uf2 go60_left go60_right "go60";

  glove80_left = firmware.zmk.override {
    board = "glove80_lh";
    keymap = ./keyboards/glove80/config/glove80.keymap;
    kconfig = ./keyboards/glove80/config/glove80.conf;
  };

  glove80_right = firmware.zmk.override {
    board = "glove80_rh";
    keymap = ./keyboards/glove80/config/glove80.keymap;
    kconfig = ./keyboards/glove80/config/glove80.conf;
  };

  glove80 = firmware.combine_uf2 glove80_left glove80_right "glove80";

  corne_left = withZmkConfig (firmware.zmk.override {
    board = "nice_nano_v2";
    shield = "corne_left";
    keymap = ./keyboards/corne/config/corne.keymap;
    kconfig = ./keyboards/corne/config/corne.conf;
    extraModules = [ ./keyboards/corne/config/corne_rgb_module ];
  }) ./keyboards/corne/config;

  corne_right = withZmkConfig (firmware.zmk.override {
    board = "nice_nano_v2";
    shield = "corne_right";
    keymap = ./keyboards/corne/config/corne.keymap;
    kconfig = ./keyboards/corne/config/corne.conf;
    extraModules = [ ./keyboards/corne/config/corne_rgb_module ];
  }) ./keyboards/corne/config;

  urchin_left = withZmkConfig (firmware.zmk.override {
    board = "nice_nano_v2";
    shield = "urchin_left;nice_view_adapter;nice_view_gem";
    keymap = ./keyboards/urchin/config/urchin.keymap;
    kconfig = ./keyboards/urchin/config/urchin.conf;
    extraModules = [ urchinModule niceViewGem ];
    snippets = [ "studio-rpc-usb-uart" ];
  }) ./keyboards/urchin/config;

  urchin_right = withZmkConfig (firmware.zmk.override {
    board = "nice_nano_v2";
    shield = "urchin_right;nice_view_adapter;nice_view_gem";
    keymap = ./keyboards/urchin/config/urchin.keymap;
    kconfig = ./keyboards/urchin/config/urchin.conf;
    extraModules = [ urchinModule niceViewGem ];
  }) ./keyboards/urchin/config;

  settings_reset = firmware.zmk.override {
    board = "nice_nano_v2";
    shield = "settings_reset";
  };

  firmwareBundle = pkgs.runCommandNoCC "ergo-keyboards-firmware" {} ''
    mkdir -p $out
    cp ${go60}/go60.uf2 $out/go60.uf2
    cp ${glove80}/glove80.uf2 $out/glove80.uf2
    cp ${corne_left}/zmk.uf2 $out/corne_left.uf2
    cp ${corne_right}/zmk.uf2 $out/corne_right.uf2
    cp ${urchin_left}/zmk.uf2 $out/urchin_left.uf2
    cp ${urchin_right}/zmk.uf2 $out/urchin_right.uf2
    cp ${settings_reset}/zmk.uf2 $out/settings_reset.uf2
  '';
in {
  inherit go60 go60_left go60_right glove80 glove80_left glove80_right corne_left corne_right urchin_left urchin_right settings_reset;
  all = firmwareBundle;
}
