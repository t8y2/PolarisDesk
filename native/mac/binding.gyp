{
  "targets": [
    {
      "target_name": "ui_tree_mac",
      "sources": [
        "ui-tree.mm"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "xcode_settings": {
        "OTHER_CFLAGS": [
          "-ObjC++",
          "-std=c++17"
        ],
        "OTHER_LDFLAGS": [
          "-framework Cocoa",
          "-framework ApplicationServices"
        ],
        "MACOSX_DEPLOYMENT_TARGET": "10.13"
      }
    }
  ]
}
