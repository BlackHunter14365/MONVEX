#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    api::notification::Notification,
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    WindowEvent,
};

/// Command to bring main workspace window to focus
#[tauri::command]
fn show_main_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

/// Command to trigger Quick Transaction Modal from native code
#[tauri::command]
fn trigger_quick_transaction(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    window
        .eval("window.dispatchEvent(new Event('monvex:open-add-transaction'))")
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Command to dispatch native OS notification
#[tauri::command]
fn send_native_notification(
    app_handle: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    Notification::new(&app_handle.config().tauri.bundle.identifier)
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Returns current desktop application version
#[tauri::command]
fn get_desktop_version() -> String {
    "2.0.1".to_string()
}

fn main() {
    // Construct System Tray Menu
    let open_workspace = CustomMenuItem::new("open".to_string(), "Open MONVEX Workspace");
    let quick_tx = CustomMenuItem::new("quick_tx".to_string(), "Quick Transaction (+)");
    let ask_ai = CustomMenuItem::new("ask_ai".to_string(), "Ask MONVEX AI Copilot");
    let dashboard = CustomMenuItem::new("dashboard".to_string(), "Command Dashboard");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit MONVEX");

    let tray_menu = SystemTrayMenu::new()
        .add_item(open_workspace)
        .add_item(quick_tx)
        .add_item(ask_ai)
        .add_item(dashboard)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .setup(|app| {
            let win = tauri::WindowBuilder::new(
                app,
                "main",
                tauri::WindowUrl::External("https://monvex-web.onrender.com".parse().unwrap()),
            )
            .title("MONVEX — Financial Intelligence")
            .initialization_script("window.__IS_TAURI__ = true; window.__MONVEX_DESKTOP__ = true;")
            .inner_size(1280.0, 860.0)
            .min_inner_size(960.0, 640.0)
            .resizable(true)
            .center()
            .decorations(true)
            .on_navigation(|url| {
                println!("[MONVEX-NAV] Navigating to: {}", url);
                if url.host_str() == Some("localhost") || url.host_str() == Some("127.0.0.1") {
                    eprintln!("[MONVEX-NAV-BLOCKED] Blocked invalid localhost navigation: {}", url);
                    return false;
                }
                true
            })
            .build()?;

            let _ = win.show();
            let _ = win.set_focus();

            Ok(())
        })
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "open" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quick_tx" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window
                            .eval("window.dispatchEvent(new Event('monvex:open-add-transaction'))");
                    }
                }
                "ask_ai" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.eval("window.location.pathname = '/ai'");
                    }
                }
                "dashboard" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.eval("window.location.pathname = '/dashboard'");
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| {
            if let WindowEvent::CloseRequested { api, .. } = event.event() {
                // Minimize to tray on close button rather than killing background process
                let _ = event.window().hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            trigger_quick_transaction,
            send_native_notification,
            get_desktop_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running MONVEX desktop application");
}
