#include <windows.h>
#include <uiautomation.h>
#include <atlbase.h>
#include <atlcom.h>
#include <string>
#include <vector>
#include "ui-tree.h"

#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")

// 辅助函数：将 BSTR 转换为 napi_value
napi_value BSTRToNapiString(napi_env env, BSTR bstr) {
    if (!bstr) {
        napi_value result;
        napi_get_null(env, &result);
        return result;
    }
    
    int len = WideCharToMultiByte(CP_UTF8, 0, bstr, -1, NULL, 0, NULL, NULL);
    if (len <= 0) {
        napi_value result;
        napi_get_null(env, &result);
        return result;
    }
    
    std::vector<char> buffer(len);
    WideCharToMultiByte(CP_UTF8, 0, bstr, -1, buffer.data(), len, NULL, NULL);
    
    napi_value result;
    napi_create_string_utf8(env, buffer.data(), NAPI_AUTO_LENGTH, &result);
    return result;
}

// 辅助函数：获取控件类型名称
std::string GetControlTypeName(CONTROLTYPEID controlType) {
    switch (controlType) {
        case UIA_ButtonControlTypeId: return "Button";
        case UIA_CalendarControlTypeId: return "Calendar";
        case UIA_CheckBoxControlTypeId: return "CheckBox";
        case UIA_ComboBoxControlTypeId: return "ComboBox";
        case UIA_EditControlTypeId: return "Edit";
        case UIA_HyperlinkControlTypeId: return "Hyperlink";
        case UIA_ImageControlTypeId: return "Image";
        case UIA_ListItemControlTypeId: return "ListItem";
        case UIA_ListControlTypeId: return "List";
        case UIA_MenuControlTypeId: return "Menu";
        case UIA_MenuBarControlTypeId: return "MenuBar";
        case UIA_MenuItemControlTypeId: return "MenuItem";
        case UIA_ProgressBarControlTypeId: return "ProgressBar";
        case UIA_RadioButtonControlTypeId: return "RadioButton";
        case UIA_ScrollBarControlTypeId: return "ScrollBar";
        case UIA_SliderControlTypeId: return "Slider";
        case UIA_SpinnerControlTypeId: return "Spinner";
        case UIA_StatusBarControlTypeId: return "StatusBar";
        case UIA_TabControlTypeId: return "Tab";
        case UIA_TabItemControlTypeId: return "TabItem";
        case UIA_TextControlTypeId: return "Text";
        case UIA_ToolBarControlTypeId: return "ToolBar";
        case UIA_ToolTipControlTypeId: return "ToolTip";
        case UIA_TreeControlTypeId: return "Tree";
        case UIA_TreeItemControlTypeId: return "TreeItem";
        case UIA_CustomControlTypeId: return "Custom";
        case UIA_GroupControlTypeId: return "Group";
        case UIA_ThumbControlTypeId: return "Thumb";
        case UIA_DataGridControlTypeId: return "DataGrid";
        case UIA_DataItemControlTypeId: return "DataItem";
        case UIA_DocumentControlTypeId: return "Document";
        case UIA_SplitButtonControlTypeId: return "SplitButton";
        case UIA_WindowControlTypeId: return "Window";
        case UIA_PaneControlTypeId: return "Pane";
        case UIA_HeaderControlTypeId: return "Header";
        case UIA_HeaderItemControlTypeId: return "HeaderItem";
        case UIA_TableControlTypeId: return "Table";
        case UIA_TitleBarControlTypeId: return "TitleBar";
        case UIA_SeparatorControlTypeId: return "Separator";
        default: return "Unknown";
    }
}

// 辅助函数：将 UI 元素转换为 JSON 对象
napi_value ElementToJSON(napi_env env, IUIAutomationElement* element, int depth, int maxDepth) {
    if (depth > maxDepth || !element) {
        napi_value result;
        napi_get_null(env, &result);
        return result;
    }
    
    napi_value obj;
    napi_create_object(env, &obj);
    
    // 获取控件类型
    CONTROLTYPEID controlType;
    if (SUCCEEDED(element->get_CurrentControlType(&controlType))) {
        std::string typeName = GetControlTypeName(controlType);
        napi_value roleValue;
        napi_create_string_utf8(env, typeName.c_str(), NAPI_AUTO_LENGTH, &roleValue);
        napi_set_named_property(env, obj, "role", roleValue);
    }
    
    // 获取名称
    CComBSTR name;
    if (SUCCEEDED(element->get_CurrentName(&name)) && name.Length() > 0) {
        napi_value nameValue = BSTRToNapiString(env, name);
        napi_set_named_property(env, obj, "title", nameValue);
    }
    
    // 获取自动化 ID
    CComBSTR automationId;
    if (SUCCEEDED(element->get_CurrentAutomationId(&automationId)) && automationId.Length() > 0) {
        napi_value idValue = BSTRToNapiString(env, automationId);
        napi_set_named_property(env, obj, "automationId", idValue);
    }
    
    // 获取类名
    CComBSTR className;
    if (SUCCEEDED(element->get_CurrentClassName(&className)) && className.Length() > 0) {
        napi_value classValue = BSTRToNapiString(env, className);
        napi_set_named_property(env, obj, "className", classValue);
    }
    
    // 获取帮助文本
    CComBSTR helpText;
    if (SUCCEEDED(element->get_CurrentHelpText(&helpText)) && helpText.Length() > 0) {
        napi_value helpValue = BSTRToNapiString(env, helpText);
        napi_set_named_property(env, obj, "help", helpValue);
    }
    
    // 获取边界矩形
    RECT rect;
    if (SUCCEEDED(element->get_CurrentBoundingRectangle(&rect))) {
        napi_value bounds;
        napi_create_object(env, &bounds);
        
        napi_value x, y, width, height;
        napi_create_double(env, rect.left, &x);
        napi_create_double(env, rect.top, &y);
        napi_create_double(env, rect.right - rect.left, &width);
        napi_create_double(env, rect.bottom - rect.top, &height);
        
        napi_set_named_property(env, bounds, "x", x);
        napi_set_named_property(env, bounds, "y", y);
        napi_set_named_property(env, bounds, "width", width);
        napi_set_named_property(env, bounds, "height", height);
        
        napi_set_named_property(env, obj, "bounds", bounds);
    }
    
    // 获取是否启用
    BOOL isEnabled;
    if (SUCCEEDED(element->get_CurrentIsEnabled(&isEnabled))) {
        napi_value enabledValue;
        napi_get_boolean(env, isEnabled, &enabledValue);
        napi_set_named_property(env, obj, "enabled", enabledValue);
    }
    
    // 获取是否有键盘焦点
    BOOL hasFocus;
    if (SUCCEEDED(element->get_CurrentHasKeyboardFocus(&hasFocus))) {
        napi_value focusedValue;
        napi_get_boolean(env, hasFocus, &focusedValue);
        napi_set_named_property(env, obj, "focused", focusedValue);
    }
    
    // 尝试获取值（对于文本框等控件）
    CComPtr<IUIAutomationValuePattern> valuePattern;
    if (SUCCEEDED(element->GetCurrentPatternAs(UIA_ValuePatternId, IID_PPV_ARGS(&valuePattern)))) {
        CComBSTR value;
        if (SUCCEEDED(valuePattern->get_CurrentValue(&value)) && value.Length() > 0) {
            napi_value valueStr = BSTRToNapiString(env, value);
            napi_set_named_property(env, obj, "value", valueStr);
        }
    }
    
    // 获取子元素
    if (depth < maxDepth) {
        CComPtr<IUIAutomationTreeWalker> walker;
        CComPtr<IUIAutomation> automation;
        
        HRESULT hr = CoCreateInstance(__uuidof(CUIAutomation), NULL, CLSCTX_INPROC_SERVER, 
                                      IID_PPV_ARGS(&automation));
        
        if (SUCCEEDED(hr) && SUCCEEDED(automation->get_ControlViewWalker(&walker))) {
            CComPtr<IUIAutomationElement> child;
            if (SUCCEEDED(walker->GetFirstChildElement(element, &child)) && child) {
                napi_value childrenArray;
                napi_create_array(env, &childrenArray);
                
                uint32_t childIndex = 0;
                int childCount = 0;
                
                do {
                    if (childCount >= 50) break; // 限制最多 50 个子元素
                    
                    napi_value childObj = ElementToJSON(env, child, depth + 1, maxDepth);
                    
                    napi_valuetype childType;
                    napi_typeof(env, childObj, &childType);
                    if (childType != napi_null) {
                        napi_set_element(env, childrenArray, childIndex++, childObj);
                    }
                    
                    childCount++;
                    
                    CComPtr<IUIAutomationElement> nextChild;
                    if (FAILED(walker->GetNextSiblingElement(child, &nextChild)) || !nextChild) {
                        break;
                    }
                    child = nextChild;
                } while (true);
                
                if (childIndex > 0) {
                    napi_set_named_property(env, obj, "children", childrenArray);
                }
                
                if (childCount >= 50) {
                    napi_value truncated;
                    napi_get_boolean(env, true, &truncated);
                    napi_set_named_property(env, obj, "childrenTruncated", truncated);
                }
            }
        }
    }
    
    return obj;
}

// 检查 UI Automation 是否可用
napi_value CheckAccessibilityPermission(napi_env env, napi_callback_info info) {
    // Windows 不需要特殊权限，UI Automation 默认可用
    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}

// 请求辅助功能权限（Windows 不需要）
napi_value RequestAccessibilityPermission(napi_env env, napi_callback_info info) {
    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}

// 获取所有活动窗口的 UI 树
napi_value GetAllActiveWindows(napi_env env, napi_callback_info info) {
    // 初始化 COM
    HRESULT hr = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);
    bool comInitialized = SUCCEEDED(hr);
    
    // 获取参数（可选的最大深度）
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);
    
    int maxDepth = 6; // 默认最大深度
    if (argc > 0) {
        napi_valuetype valuetype;
        napi_typeof(env, args[0], &valuetype);
        if (valuetype == napi_number) {
            int32_t depth;
            napi_get_value_int32(env, args[0], &depth);
            if (depth > 0 && depth <= 15) {
                maxDepth = depth;
            }
        }
    }
    
    // 创建结果数组
    napi_value windowsArray;
    napi_create_array(env, &windowsArray);
    
    // 创建 UI Automation 实例
    CComPtr<IUIAutomation> automation;
    hr = CoCreateInstance(__uuidof(CUIAutomation), NULL, CLSCTX_INPROC_SERVER, 
                          IID_PPV_ARGS(&automation));
    
    if (FAILED(hr)) {
        if (comInitialized) CoUninitialize();
        return windowsArray;
    }
    
    // 获取桌面根元素
    CComPtr<IUIAutomationElement> root;
    hr = automation->GetRootElement(&root);
    if (FAILED(hr)) {
        if (comInitialized) CoUninitialize();
        return windowsArray;
    }
    
    // 创建条件：查找所有窗口
    CComPtr<IUIAutomationCondition> windowCondition;
    VARIANT varProp;
    varProp.vt = VT_I4;
    varProp.lVal = UIA_WindowControlTypeId;
    automation->CreatePropertyCondition(UIA_ControlTypePropertyId, varProp, &windowCondition);
    
    // 查找所有窗口
    CComPtr<IUIAutomationElementArray> windows;
    hr = root->FindAll(TreeScope_Children, windowCondition, &windows);
    
    if (SUCCEEDED(hr) && windows) {
        int windowCount;
        windows->get_Length(&windowCount);
        
        int validWindowIndex = 0;
        for (int i = 0; i < windowCount && i < 20; i++) { // 限制最多 20 个窗口
            CComPtr<IUIAutomationElement> window;
            if (SUCCEEDED(windows->GetElement(i, &window)) && window) {
                // 检查窗口是否可见
                BOOL isOffscreen;
                if (SUCCEEDED(window->get_CurrentIsOffscreen(&isOffscreen)) && isOffscreen) {
                    continue;
                }
                
                // 创建窗口对象
                napi_value windowObj;
                napi_create_object(env, &windowObj);
                
                // 获取窗口标题
                CComBSTR windowName;
                if (SUCCEEDED(window->get_CurrentName(&windowName)) && windowName.Length() > 0) {
                    napi_value title = BSTRToNapiString(env, windowName);
                    napi_set_named_property(env, windowObj, "windowTitle", title);
                }
                
                // 获取进程 ID
                int processId;
                if (SUCCEEDED(window->get_CurrentProcessId(&processId))) {
                    napi_value pid;
                    napi_create_int32(env, processId, &pid);
                    napi_set_named_property(env, windowObj, "processId", pid);
                    
                    // 获取进程名称
                    HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, processId);
                    if (hProcess) {
                        WCHAR processName[MAX_PATH];
                        DWORD size = MAX_PATH;
                        if (QueryFullProcessImageNameW(hProcess, 0, processName, &size)) {
                            // 只取文件名部分
                            WCHAR* fileName = wcsrchr(processName, L'\\');
                            if (fileName) {
                                fileName++;
                            } else {
                                fileName = processName;
                            }
                            
                            CComBSTR bstrProcessName(fileName);
                            napi_value appName = BSTRToNapiString(env, bstrProcessName);
                            napi_set_named_property(env, windowObj, "applicationName", appName);
                        }
                        CloseHandle(hProcess);
                    }
                }
                
                // 获取窗口的 UI 树
                napi_value uiTree = ElementToJSON(env, window, 0, maxDepth);
                napi_set_named_property(env, windowObj, "uiTree", uiTree);
                
                // 添加到结果数组
                napi_set_element(env, windowsArray, validWindowIndex++, windowObj);
            }
        }
    }
    
    if (comInitialized) {
        CoUninitialize();
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
