// Copyright 2026 the img2bez Authors
// SPDX-License-Identifier: Apache-2.0 OR MIT

use serde::Deserialize;
use wasm_bindgen::prelude::*;

#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct Config {
    glyph: Option<String>,
    unicode: Option<String>,
    profile: Option<String>,
    mode: Option<String>,
    style: Option<String>,
    width: Option<f64>,
    target_height: Option<f64>,
    y_offset: Option<f64>,
    grid: Option<i32>,
    chamfer: Option<f64>,
    chamfer_min_edge: Option<f64>,
    accuracy: Option<f64>,
    refine: Option<bool>,
    invert: Option<bool>,
    threshold: Option<u8>,
    corner_head: Option<bool>,
    site_head: Option<bool>,
    fit_source: Option<String>,
    fit_y_min: Option<f64>,
    fit_y_max: Option<f64>,
    lsb: Option<f64>,
    rsb: Option<f64>,
}

#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

fn trace_glyph(image_bytes: &[u8], config_json: &str) -> Result<img2bez::Glyph, JsValue> {
    if image_bytes.is_empty() {
        return Err(JsValue::from_str("image bytes are empty"));
    }
    let cfg: Config = serde_json::from_str(config_json)
        .map_err(|e| JsValue::from_str(&format!("config: {e}")))?;
    img2bez::set_corner_head(cfg.corner_head);
    img2bez::set_site_head(cfg.site_head);
    let (mut opts, metrics) = build_config(&cfg);
    opts.rtl_start = cfg.unicode.as_deref()
        .and_then(|h| u32::from_str_radix(h.trim(), 16).ok())
        .and_then(char::from_u32)
        .is_some_and(img2bez::is_rtl_codepoint);
    let name = cfg.glyph.clone().unwrap_or_else(|| "a".to_string());
    let codepoints: Vec<char> = cfg.unicode.as_deref()
        .and_then(|h| u32::from_str_radix(h.trim(), 16).ok())
        .and_then(char::from_u32)
        .into_iter()
        .collect();
    img2bez::trace_glyph(image_bytes, name, &codepoints, &opts, &metrics)
        .map_err(|e| JsValue::from_str(&format!("trace: {e}")))
}

#[wasm_bindgen(js_name = traceToJson)]
pub fn trace_to_json(image_bytes: &[u8], config_json: &str) -> Result<String, JsValue> {
    let glyph = trace_glyph(image_bytes, config_json)?;
    serde_json::to_string(&glyph).map_err(|e| JsValue::from_str(&format!("json: {e}")))
}

#[wasm_bindgen(js_name = traceWithJudge)]
pub fn trace_with_judge(image_bytes: &[u8], config_json: &str) -> Result<String, JsValue> {
    if image_bytes.is_empty() {
        return Err(JsValue::from_str("image bytes are empty"));
    }
    let cfg: Config = serde_json::from_str(config_json)
        .map_err(|e| JsValue::from_str(&format!("config: {e}")))?;
    img2bez::set_corner_head(cfg.corner_head);
    img2bez::set_site_head(cfg.site_head);
    let (mut opts, metrics) = build_config(&cfg);
    opts.rtl_start = cfg.unicode.as_deref()
        .and_then(|h| u32::from_str_radix(h.trim(), 16).ok())
        .and_then(char::from_u32)
        .is_some_and(img2bez::is_rtl_codepoint);
    let name = cfg.glyph.clone().unwrap_or_else(|| "a".to_string());
    let codepoints: Vec<char> = cfg.unicode.as_deref()
        .and_then(|h| u32::from_str_radix(h.trim(), 16).ok())
        .and_then(char::from_u32)
        .into_iter()
        .collect();
    let placement = build_placement(&cfg, opts.grid)?;
    let (placed, report) = img2bez::trace_place(image_bytes, &opts, &placement)
        .map_err(|e| JsValue::from_str(&format!("trace: {e}")))?;
    let glyph = img2bez::glyph_from_placed(name, &codepoints, &placed, &metrics);
    let judge = img2bez::judge::judge_source(&glyph.outline, image_bytes, &opts)
        .map_err(|e| JsValue::from_str(&format!("judge: {e}")))?;
    let out = serde_json::json!({ "glyph": glyph, "judge": judge, "report": report });
    serde_json::to_string(&out).map_err(|e| JsValue::from_str(&format!("json: {e}")))
}

#[wasm_bindgen(js_name = traceToSvg)]
pub fn trace_to_svg(image_bytes: &[u8], config_json: &str) -> Result<String, JsValue> {
    Ok(trace_glyph(image_bytes, config_json)?.outline.to_svg_path())
}

#[wasm_bindgen(js_name = tracePlaceToJson)]
pub fn trace_place_to_json(image_bytes: &[u8], config_json: &str) -> Result<String, JsValue> {
    if image_bytes.is_empty() {
        return Err(JsValue::from_str("image bytes are empty"));
    }
    let cfg: Config = serde_json::from_str(config_json)
        .map_err(|e| JsValue::from_str(&format!("config: {e}")))?;
    img2bez::set_corner_head(cfg.corner_head);
    img2bez::set_site_head(cfg.site_head);
    let (mut opts, metrics) = build_config(&cfg);
    opts.verbose = false;
    let name = cfg.glyph.clone().unwrap_or_else(|| "a".to_string());
    let codepoints: Vec<char> = cfg.unicode.as_deref()
        .and_then(|h| u32::from_str_radix(h.trim(), 16).ok())
        .and_then(char::from_u32)
        .into_iter()
        .collect();
    let placement = build_placement(&cfg, opts.grid)?;
    let (placed, report) = img2bez::trace_place(image_bytes, &opts, &placement)
        .map_err(|e| JsValue::from_str(&format!("trace: {e}")))?;
    let glyph = img2bez::glyph_from_placed(name, &codepoints, &placed, &metrics);
    #[derive(serde::Serialize)]
    struct Out { glyph: img2bez::Glyph, report: img2bez::PlacementReport }
    serde_json::to_string(&Out { glyph, report })
        .map_err(|e| JsValue::from_str(&format!("json: {e}")))
}

fn build_placement(cfg: &Config, grid: i32) -> Result<img2bez::PlacementOptions, JsValue> {
    use img2bez::{Sidebearings, SourceBox, TargetBand};
    let sidebearings = Sidebearings::Explicit {
        lsb: cfg.lsb.unwrap_or(64.0),
        rsb: cfg.rsb.unwrap_or(64.0),
    };
    let source = match cfg.fit_source.as_deref().unwrap_or("canvas") {
        "ink" => SourceBox::InkBounds,
        "canvas" => SourceBox::Canvas,
        other => return Err(JsValue::from_str(&format!("fitSource must be \"ink\" or \"canvas\", got {other:?}"))),
    };
    let (y_min, y_max) = match (cfg.fit_y_min, cfg.fit_y_max) {
        (Some(lo), Some(hi)) => (lo, hi),
        _ if source == SourceBox::InkBounds => return Err(JsValue::from_str("fitSource \"ink\" requires fitYMin and fitYMax")),
        _ => (-256.0, 832.0),
    };
    let mut placement = img2bez::PlacementOptions::ink_fit(
        TargetBand::Custom { y_min, y_max },
        sidebearings,
    );
    placement.source = source;
    placement.grid = grid;
    Ok(placement)
}

fn build_config(cfg: &Config) -> (img2bez::TraceOptions, img2bez::FontMetrics) {
    let profile = img2bez::Profile::from_name_lossy(cfg.profile.as_deref().unwrap_or("wild"));
    let mut opts = img2bez::TraceOptions::for_profile(profile);
    opts.verbose = false;
    if let Some(accuracy) = cfg.accuracy { opts.fit_accuracy = accuracy.max(0.1); }
    if let Some(h) = cfg.target_height { opts.em_height = h.max(1.0); }
    if let Some(g) = cfg.grid { opts.grid = g.max(0); }
    if let Some(chamfer) = cfg.chamfer { opts.chamfer_size = chamfer.max(0.0); }
    if let Some(min_edge) = cfg.chamfer_min_edge { opts.chamfer_min_edge = min_edge.max(0.0); }
    if let Some(refine) = cfg.refine { opts.refine_raster = refine; }
    if let Some(inv) = cfg.invert { opts.invert = inv; }
    if let Some(t) = cfg.threshold { opts.threshold = img2bez::ThresholdMethod::Fixed(t); }
    if let Some(m) = cfg.mode.as_deref() {
        opts.mode = match m {
            "smooth" => img2bez::TraceMode::Smooth,
            "line" => img2bez::TraceMode::LineOnly,
            _ => img2bez::TraceMode::Default,
        };
    }
    img2bez::Style::from_name_lossy(cfg.style.as_deref().unwrap_or("basic")).apply(&mut opts);
    let target_height = cfg.target_height.map(|h| h.max(1.0)).unwrap_or(1088.0);
    let y_offset = cfg.y_offset.unwrap_or(-256.0);
    let mut metrics = img2bez::FontMetrics::from_target_height(target_height, y_offset);
    metrics.advance_width = cfg.width;
    (opts, metrics)
}
