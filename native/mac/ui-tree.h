#ifndef UI_TREE_H
#define UI_TREE_H

#include <node_api.h>

// 初始化模块
napi_value Init(napi_env env, napi_value exports);

// 获取活动窗口的 UI 树
napi_value GetActiveWindowUITree(napi_env env, napi_callback_info info);

// 获取所有活动窗口的 UI 树
napi_value GetAllActiveWindows(napi_env env, napi_callback_info info);

// 检查是否有辅助功能权限
napi_value CheckAccessibilityPermission(napi_env env, napi_callback_info info);

// 请求辅助功能权限
napi_value RequestAccessibilityPermission(napi_env env, napi_callback_info info);

#endif // UI_TREE_H
