window.__ModuleLoader__.load({
	id: "api-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var React = require("react");
		//#region api-balance client
		const inject = ["slots"];
		// ---- refresh preference (localStorage-backed, survives page reloads) ----
		var STORAGE_KEY = "dsh.api-balance.refresh";
		var DEFAULT_CONFIG = { mode: "auto", seconds: 30 };
		var MIN_SECONDS = 5;
		var MAX_SECONDS = 3600;
		var PRESETS = [
			{ value: "manual", label: "手动刷新" },
			{ value: 10, label: "每 10 秒" },
			{ value: 30, label: "每 30 秒" },
			{ value: 60, label: "每 1 分钟" },
			{ value: 300, label: "每 5 分钟" },
			{ value: "custom", label: "自定义…" }
		];
		function clampSeconds(value) {
			var n = parseInt(value, 10);
			if (!isFinite(n)) return DEFAULT_CONFIG.seconds;
			if (n < MIN_SECONDS) return MIN_SECONDS;
			if (n > MAX_SECONDS) return MAX_SECONDS;
			return n;
		}
		function loadConfig() {
			try {
				var raw = localStorage.getItem(STORAGE_KEY);
				if (!raw) return { mode: DEFAULT_CONFIG.mode, seconds: DEFAULT_CONFIG.seconds };
				var parsed = JSON.parse(raw);
				if (!parsed || typeof parsed !== "object") return { mode: DEFAULT_CONFIG.mode, seconds: DEFAULT_CONFIG.seconds };
				return {
					mode: parsed.mode === "manual" ? "manual" : "auto",
					seconds: clampSeconds(parsed.seconds)
				};
			} catch (err) {
				return { mode: DEFAULT_CONFIG.mode, seconds: DEFAULT_CONFIG.seconds };
			}
		}
		function saveConfig(config) {
			try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch (err) {}
		}
		function presetValueOf(config) {
			if (config.mode === "manual") return "manual";
			for (var i = 0; i < PRESETS.length; i++) {
				if (PRESETS[i].value === config.seconds) return String(config.seconds);
			}
			return "custom";
		}
		// ---- styles ----
		var dockStyle = { display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", padding: "2px 4px", fontSize: "12px", lineHeight: "16px", color: "var(--dsw-alias-label-secondary)" };
		var amtStyle = { fontWeight: 600, color: "var(--dsw-alias-label-primary)" };
		var okStyle = { color: "var(--dsw-alias-state-success-primary)" };
		var badStyle = { color: "var(--dsw-alias-state-error-primary)" };
		var warnStyle = { color: "var(--dsw-alias-state-warn-primary)" };
		var mutedStyle = { opacity: 0.75 };
		var controlStyle = { background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-secondary)", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "6px", fontSize: "12px", lineHeight: "16px", padding: "1px 6px", fontFamily: "inherit" };
		var buttonStyle = { background: "transparent", color: "var(--dsw-alias-label-secondary)", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "6px", fontSize: "12px", lineHeight: "16px", padding: "2px 10px", cursor: "pointer", fontFamily: "inherit" };
		var primaryButtonStyle = { background: "var(--dsw-alias-brand-primary)", color: "var(--dsw-alias-bg-base)", border: "none", borderRadius: "6px", fontSize: "12px", lineHeight: "16px", padding: "2px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 };
		var primaryButtonDisabledStyle = { background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-secondary)", border: "none", borderRadius: "6px", fontSize: "12px", lineHeight: "16px", padding: "2px 12px", cursor: "default", fontFamily: "inherit", fontWeight: 600, opacity: 0.5 };
		var backdropStyle = { position: "fixed", inset: "0px", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 };
		var dialogStyle = { background: "var(--dsw-alias-bg-layer-2)", border: "1px solid var(--dsw-alias-border-l1)", borderRadius: "12px", padding: "16px 18px", width: "280px", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", fontFamily: "inherit" };
		var dialogTitleStyle = { fontSize: "14px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" };
		var dialogHintStyle = { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" };
		var dialogInputStyle = { background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "6px", fontSize: "13px", lineHeight: "20px", padding: "4px 8px", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
		var dialogErrorStyle = { fontSize: "12px", color: "var(--dsw-alias-state-error-primary)" };
		var dialogActionsStyle = { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "2px" };
		// ---- component ----
		function BalanceDock() {
			var state = React.useState({ kind: "loading" });
			var view = state[0];
			var setView = state[1];
			var cfgState = React.useState(loadConfig);
			var config = cfgState[0];
			var setConfig = cfgState[1];
			var modalState = React.useState(false);
			var modalOpen = modalState[0];
			var setModalOpen = modalState[1];
			var draftState = React.useState(String(DEFAULT_CONFIG.seconds));
			var draft = draftState[0];
			var setDraft = draftState[1];
			var refresh = React.useCallback(function () {
				fetch("/api/abal-balance", { cache: "no-store" }).then(function (response) {
					return response.json();
				}).then(function (res) {
					setView(function (prev) {
						if (res && res.ok === true) return { kind: "data", data: res, stale: false, error: null };
						var error = String((res && res.error) || "empty response");
						return prev.kind === "data" ? { kind: "data", data: prev.data, stale: true, error: error } : { kind: "error", error: error };
					});
				}, function (err) {
					setView(function (prev) {
						var error = String((err && err.message) || err);
						return prev.kind === "data" ? { kind: "data", data: prev.data, stale: true, error: error } : { kind: "error", error: error };
					});
				});
			}, []);
			React.useEffect(function () {
				refresh();
				if (config.mode === "manual") return undefined;
				var id = setInterval(refresh, config.seconds * 1000);
				return function () { clearInterval(id); };
			}, [refresh, config.mode, config.seconds]);
			React.useEffect(function () {
				saveConfig(config);
			}, [config]);
			React.useEffect(function () {
				if (!modalOpen) return undefined;
				function onKey(event) {
					if (event.key === "Escape") setModalOpen(false);
				}
				document.addEventListener("keydown", onKey);
				return function () { document.removeEventListener("keydown", onKey); };
			}, [modalOpen]);
			var draftNum = parseInt(draft, 10);
			var draftValid = isFinite(draftNum) && draftNum >= MIN_SECONDS && draftNum <= MAX_SECONDS;
			var openCustom = function () {
				setDraft(String(config.seconds));
				setModalOpen(true);
			};
			var confirmCustom = function () {
				if (!draftValid) return;
				setConfig({ mode: "auto", seconds: draftNum });
				setModalOpen(false);
			};
			// readout body
			var body;
			if (view.kind === "loading") {
				body = React.createElement("span", { key: "loading", style: mutedStyle }, "查询中…");
			} else if (view.kind === "error") {
				body = [
					React.createElement("span", { key: "err", style: badStyle }, "获取失败"),
					React.createElement("span", { key: "errmsg", style: mutedStyle, title: String(view.error) }, String(view.error))
				];
			} else {
				var data = view.data;
				if (!data || data.ok !== true || !Array.isArray(data.balances) || data.balances.length === 0) {
					var emptyError = String((data && data.error) || "empty response");
					body = [
						React.createElement("span", { key: "err", style: badStyle }, "获取失败"),
						React.createElement("span", { key: "errmsg", style: mutedStyle, title: emptyError }, emptyError)
					];
				} else {
					var cells = [];
					for (var i = 0; i < data.balances.length; i++) {
						var b = data.balances[i];
						cells.push(React.createElement("span", { key: b.currency || "cur", style: amtStyle }, b.currency + " " + b.total));
					}
					var updated = data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : "";
					body = [
						React.createElement("span", { key: "label" }, "API 余额"),
						React.createElement("span", { key: "sp1", style: mutedStyle }, "·")
					].concat(cells, [
						React.createElement("span", { key: "sp2", style: mutedStyle }, "·"),
						data.isAvailable
							? React.createElement("span", { key: "avail", style: okStyle }, "可用")
							: React.createElement("span", { key: "avail", style: badStyle }, "不可用"),
						React.createElement("span", { key: "time", style: mutedStyle }, updated ? updated + " 更新" : "")
					]);
					if (view.stale) {
						body.push(React.createElement("span", { key: "stale", style: warnStyle, title: String(view.error) }, "刷新失败"));
					}
				}
			}
			// control: preset select + refresh button
			var presetValue = presetValueOf(config);
			var options = [];
			for (var j = 0; j < PRESETS.length; j++) {
				var p = PRESETS[j];
				var label = p.label;
				if (p.value === "custom" && presetValue === "custom") {
					label = "自定义 " + config.seconds + " 秒";
				}
				options.push(React.createElement("option", { key: String(p.value), value: String(p.value) }, label));
			}
			var selectEl = React.createElement("select", {
				key: "sel",
				style: controlStyle,
				value: presetValue,
				title: "刷新模式（自定义范围 " + MIN_SECONDS + "–" + MAX_SECONDS + " 秒）",
				onChange: function (event) {
					var value = event.target.value;
					if (value === "manual") setConfig({ mode: "manual", seconds: config.seconds });
					else if (value === "custom") openCustom();
					else setConfig({ mode: "auto", seconds: clampSeconds(value) });
				}
			}, options);
			var refreshButton = React.createElement("button", {
				key: "btn",
				type: "button",
				style: buttonStyle,
				title: "立即刷新",
				onClick: refresh
			}, "刷新");
			var children = [selectEl, refreshButton, React.createElement("span", { key: "sep", style: mutedStyle }, "|")];
			children = children.concat(Array.isArray(body) ? body : [body]);
			// custom-interval dialog
			if (modalOpen) {
				var okButtonStyle = draftValid ? primaryButtonStyle : primaryButtonDisabledStyle;
				children.push(React.createElement("div", {
					key: "modal",
					style: backdropStyle,
					onClick: function () { setModalOpen(false); }
				},
					React.createElement("div", {
						style: dialogStyle,
						onClick: function (event) { event.stopPropagation(); }
					},
						React.createElement("div", { style: dialogTitleStyle }, "自定义刷新间隔"),
						React.createElement("div", { style: dialogHintStyle }, "输入自动刷新间隔（秒）：范围 " + MIN_SECONDS + " – " + MAX_SECONDS + " 秒"),
						React.createElement("input", {
							type: "number",
							min: MIN_SECONDS,
							max: MAX_SECONDS,
							step: 1,
							autoFocus: true,
							style: dialogInputStyle,
							value: draft,
							onChange: function (event) { setDraft(event.target.value); },
							onKeyDown: function (event) {
								if (event.key === "Enter" && draftValid) confirmCustom();
							}
						}),
						draftValid ? null : React.createElement("div", { style: dialogErrorStyle }, "请输入 " + MIN_SECONDS + " 到 " + MAX_SECONDS + " 之间的整数秒数"),
						React.createElement("div", { style: dialogActionsStyle },
							React.createElement("button", { type: "button", style: buttonStyle, onClick: function () { setModalOpen(false); } }, "取消"),
							React.createElement("button", { type: "button", style: okButtonStyle, disabled: !draftValid, onClick: confirmCustom }, "确定")
						)
					)
				));
			}
			return React.createElement("div", { style: dockStyle, title: view.stale ? String(view.error) : undefined }, children);
		}
		function apply(ctx) {
			var slots = ctx.get("slots");
			if (slots === undefined) return;
			slots.inject("conversation.composer.dock", function () {
				return slots.register({
					name: "conversation.composer.dock",
					id: "api-balance",
					order: 10
				}, function () {
					return React.createElement(BalanceDock);
				});
			});
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
