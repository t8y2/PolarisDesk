#import <Cocoa/Cocoa.h>
#import <ApplicationServices/ApplicationServices.h>
#include "ui-tree.h"

// 辅助函数：将 CFStringRef 转换为 napi_value
napi_value CFStringToNapiString(napi_env env, CFStringRef cfString) {
    if (!cfString) {
        napi_value result;
        napi_get_null(env, &result);
        return result;
    }
    
    CFIndex length = CFStringGetLength(cfString);
    CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
    char* buffer = (char*)malloc(maxSize);
    
    if (CFStringGetCString(cfString, buffer, maxSize, kCFStringEncodingUTF8)) {
        napi_value result;
        napi_create_string_utf8(env, buffer, NAPI_AUTO_LENGTH, &result);
        free(buffer);
        return result;
    }
    
    free(buffer);
    napi_value result;
    napi_get_null(env, &result);
    return result;
}

// 辅助函数：获取 AXUIElement 的属性值
CFTypeRef GetAXAttribute(AXUIElementRef element, CFStringRef attribute) {
    CFTypeRef value = NULL;
    AXError error = AXUIElementCopyAttributeValue(element, attribute, &value);
    if (error != kAXErrorSuccess) {
        return NULL;
    }
    return value;
}

// 辅助函数：将 UI 元素转换为 JSON 对象
napi_value ElementToJSON(napi_env env, AXUIElementRef element, int depth, int maxDepth) {
    if (depth > maxDepth || !element) {
        napi_value result;
        napi_get_null(env, &result);
        return result;
    }
    
    napi_value obj;
    napi_create_object(env, &obj);
    
    // 获取角色 (role)
    CFStringRef role = (CFStringRef)GetAXAttribute(element, kAXRoleAttribute);
    if (role) {
        napi_value roleValue = CFStringToNapiString(env, role);
        napi_set_named_property(env, obj, "role", roleValue);
        CFRelease(role);
    }
    
    // 获取角色描述 (roleDescription)
    CFStringRef roleDesc = (CFStringRef)GetAXAttribute(element, kAXRoleDescriptionAttribute);
    if (roleDesc) {
        napi_value roleDescValue = CFStringToNapiString(env, roleDesc);
        napi_set_named_property(env, obj, "roleDescription", roleDescValue);
        CFRelease(roleDesc);
    }
    
    // 获取标题 (title)
    CFStringRef title = (CFStringRef)GetAXAttribute(element, kAXTitleAttribute);
    if (title) {
        napi_value titleValue = CFStringToNapiString(env, title);
        napi_set_named_property(env, obj, "title", titleValue);
        CFRelease(title);
    }
    
    // 获取值 (value)
    CFTypeRef value = GetAXAttribute(element, kAXValueAttribute);
    if (value) {
        CFTypeID typeID = CFGetTypeID(value);
        if (typeID == CFStringGetTypeID()) {
            napi_value valueStr = CFStringToNapiString(env, (CFStringRef)value);
            napi_set_named_property(env, obj, "value", valueStr);
        } else if (typeID == CFNumberGetTypeID()) {
            double numValue;
            CFNumberGetValue((CFNumberRef)value, kCFNumberDoubleType, &numValue);
            napi_value valueNum;
            napi_create_double(env, numValue, &valueNum);
            napi_set_named_property(env, obj, "value", valueNum);
        }
        CFRelease(value);
    }
    
    // 获取描述 (description)
    CFStringRef desc = (CFStringRef)GetAXAttribute(element, kAXDescriptionAttribute);
    if (desc) {
        napi_value descValue = CFStringToNapiString(env, desc);
        napi_set_named_property(env, obj, "description", descValue);
        CFRelease(desc);
    }
    
    // 获取帮助文本 (help)
    CFStringRef help = (CFStringRef)GetAXAttribute(element, kAXHelpAttribute);
    if (help) {
        napi_value helpValue = CFStringToNapiString(env, help);
        napi_set_named_property(env, obj, "help", helpValue);
        CFRelease(help);
    }
    
    // 获取位置和大小
    CFTypeRef position = GetAXAttribute(element, kAXPositionAttribute);
    CFTypeRef size = GetAXAttribute(element, kAXSizeAttribute);
    
    if (position && size) {
        CGPoint point;
        CGSize cgSize;
        
        if (AXValueGetValue((AXValueRef)position, (AXValueType)kAXValueCGPointType, &point) &&
            AXValueGetValue((AXValueRef)size, (AXValueType)kAXValueCGSizeType, &cgSize)) {
            
            napi_value bounds;
            napi_create_object(env, &bounds);
            
            napi_value x, y, width, height;
            napi_create_double(env, point.x, &x);
            napi_create_double(env, point.y, &y);
            napi_create_double(env, cgSize.width, &width);
            napi_create_double(env, cgSize.height, &height);
            
            napi_set_named_property(env, bounds, "x", x);
            napi_set_named_property(env, bounds, "y", y);
            napi_set_named_property(env, bounds, "width", width);
            napi_set_named_property(env, bounds, "height", height);
            
            napi_set_named_property(env, obj, "bounds", bounds);
        }
    }
    
    if (position) CFRelease(position);
    if (size) CFRelease(size);
    
    // 获取是否启用
    CFBooleanRef enabled = (CFBooleanRef)GetAXAttribute(element, kAXEnabledAttribute);
    if (enabled) {
        napi_value enabledValue;
        napi_get_boolean(env, CFBooleanGetValue(enabled), &enabledValue);
        napi_set_named_property(env, obj, "enabled", enabledValue);
        CFRelease(enabled);
    }
    
    // 获取是否聚焦
    CFBooleanRef focused = (CFBooleanRef)GetAXAttribute(element, kAXFocusedAttribute);
    if (focused) {
        napi_value focusedValue;
        napi_get_boolean(env, CFBooleanGetValue(focused), &focusedValue);
        napi_set_named_property(env, obj, "focused", focusedValue);
        CFRelease(focused);
    }
    
    // 递归获取子元素
    CFArrayRef children = (CFArrayRef)GetAXAttribute(element, kAXChildrenAttribute);
    if (children) {
        CFIndex childCount = CFArrayGetCount(children);
        
        if (childCount > 0) {
            napi_value childrenArray;
            napi_create_array(env, &childrenArray);
            
            uint32_t validChildIndex = 0;
            for (CFIndex i = 0; i < childCount && i < 50; i++) { // 限制最多 50 个子元素
                AXUIElementRef child = (AXUIElementRef)CFArrayGetValueAtIndex(children, i);
                if (child) {
                    napi_value childObj = ElementToJSON(env, child, depth + 1, maxDepth);
                    
                    // 只添加非 null 的子元素
                    napi_valuetype childType;
                    napi_typeof(env, childObj, &childType);
                    if (childType != napi_null) {
                        napi_set_element(env, childrenArray, validChildIndex++, childObj);
                    }
                }
            }
            
            // 只有在有有效子元素时才添加 children 属性
            if (validChildIndex > 0) {
                napi_set_named_property(env, obj, "children", childrenArray);
            }
            
            // 如果子元素太多，添加一个标记
            if (childCount > 50) {
                napi_value truncated;
                napi_get_boolean(env, true, &truncated);
                napi_set_named_property(env, obj, "childrenTruncated", truncated);
                
                napi_value totalCount;
                napi_create_int32(env, (int32_t)childCount, &totalCount);
                napi_set_named_property(env, obj, "totalChildrenCount", totalCount);
            }
        }
        
        CFRelease(children);
    }
    
    return obj;
}

// 检查辅助功能权限
napi_value CheckAccessibilityPermission(napi_env env, napi_callback_info info) {
    NSDictionary* options = @{(__bridge id)kAXTrustedCheckOptionPrompt: @NO};
    Boolean hasPermission = AXIsProcessTrustedWithOptions((__bridge CFDictionaryRef)options);
    
    napi_value result;
    napi_get_boolean(env, hasPermission, &result);
    return result;
}

// 请求辅助功能权限
napi_value RequestAccessibilityPermission(napi_env env, napi_callback_info info) {
    NSDictionary* options = @{(__bridge id)kAXTrustedCheckOptionPrompt: @YES};
    Boolean hasPermission = AXIsProcessTrustedWithOptions((__bridge CFDictionaryRef)options);
    
    napi_value result;
    napi_get_boolean(env, hasPermission, &result);
    return result;
}

// 获取所有活动窗口的 UI 树
napi_value GetAllActiveWindows(napi_env env, napi_callback_info info) {
    // 检查权限
    if (!AXIsProcessTrusted()) {
        napi_value error;
        napi_create_object(env, &error);
        
        napi_value errorMsg;
        napi_create_string_utf8(env, "Accessibility permission not granted", NAPI_AUTO_LENGTH, &errorMsg);
        napi_set_named_property(env, error, "error", errorMsg);
        
        napi_value hasPermission;
        napi_get_boolean(env, false, &hasPermission);
        napi_set_named_property(env, error, "hasPermission", hasPermission);
        
        return error;
    }
    
    // 获取参数（可选的最大深度）
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    
    int maxDepth = 3; // 默认最大深度
    if (argc > 0) {
        napi_valuetype valuetype;
        napi_typeof(env, args[0], &valuetype);
        if (valuetype == napi_number) {
            int32_t depth;
            napi_get_value_int32(env, args[0], &depth);
            if (depth > 0 && depth <= 10) {
                maxDepth = depth;
            }
        }
    }
    
    // 创建结果数组
    napi_value windowsArray;
    napi_create_array(env, &windowsArray);
    
    // 获取所有运行的应用
    NSArray<NSRunningApplication *> *runningApps = [[NSWorkspace sharedWorkspace] runningApplications];
    
    int windowIndex = 0;
    for (NSRunningApplication *app in runningApps) {
        // 跳过后台应用和隐藏的应用
        if (app.activationPolicy != NSApplicationActivationPolicyRegular) {
            continue;
        }
        
        pid_t pid = [app processIdentifier];
        AXUIElementRef appElement = AXUIElementCreateApplication(pid);
        
        if (!appElement) {
            continue;
        }
        
        // 获取应用的所有窗口
        CFArrayRef windows = NULL;
        AXError error = AXUIElementCopyAttributeValue(appElement, kAXWindowsAttribute, (CFTypeRef*)&windows);
        
        if (error == kAXErrorSuccess && windows) {
            CFIndex windowCount = CFArrayGetCount(windows);
            
            for (CFIndex i = 0; i < windowCount && i < 10; i++) { // 限制每个应用最多10个窗口
                AXUIElementRef window = (AXUIElementRef)CFArrayGetValueAtIndex(windows, i);
                
                // 创建窗口对象
                napi_value windowObj;
                napi_create_object(env, &windowObj);
                
                // 添加应用信息
                napi_value appName;
                napi_create_string_utf8(env, [[app localizedName] UTF8String], NAPI_AUTO_LENGTH, &appName);
                napi_set_named_property(env, windowObj, "applicationName", appName);
                
                napi_value bundleId;
                napi_create_string_utf8(env, [[app bundleIdentifier] UTF8String], NAPI_AUTO_LENGTH, &bundleId);
                napi_set_named_property(env, windowObj, "bundleIdentifier", bundleId);
                
                napi_value processId;
                napi_create_int32(env, pid, &processId);
                napi_set_named_property(env, windowObj, "processId", processId);
                
                // 获取窗口标题
                CFStringRef windowTitle = (CFStringRef)GetAXAttribute(window, kAXTitleAttribute);
                if (windowTitle) {
                    napi_value title = CFStringToNapiString(env, windowTitle);
                    napi_set_named_property(env, windowObj, "windowTitle", title);
                    CFRelease(windowTitle);
                }
                
                // 获取窗口的 UI 树
                napi_value uiTree = ElementToJSON(env, window, 0, maxDepth);
                napi_set_named_property(env, windowObj, "uiTree", uiTree);
                
                // 添加到结果数组
                napi_set_element(env, windowsArray, windowIndex++, windowObj);
            }
            
            CFRelease(windows);
        }
        
        CFRelease(appElement);
    }
    
    return windowsArray;
}

// 模块初始化
napi_value Init(napi_env env, napi_value exports) {
    napi_value checkPermissionFn, requestPermissionFn, getAllWindowsFn;
    
    napi_create_function(env, NULL, 0, CheckAccessibilityPermission, NULL, &checkPermissionFn);
    napi_create_function(env, NULL, 0, RequestAccessibilityPermission, NULL, &requestPermissionFn);
    napi_create_function(env, NULL, 0, GetAllActiveWindows, NULL, &getAllWindowsFn);
    
    napi_set_named_property(env, exports, "checkAccessibilityPermission", checkPermissionFn);
    napi_set_named_property(env, exports, "requestAccessibilityPermission", requestPermissionFn);
    napi_set_named_property(env, exports, "getAllActiveWindows", getAllWindowsFn);
    
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
