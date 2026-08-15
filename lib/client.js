window.__ModuleLoader__.load({
	id: "api-balance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var React = require("react");
		//#region api-balance client
		const inject = ["slots"];
		var dockStyle = { display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", padding: "2px 4px", fontSize: "12px", lineHeight: "16px", color: "var(--dsw-alias-label-secondary)" };
		var amtStyle = { fontWeight: 600, color: "var(--dsw-alias-label-primary)" };
		var okStyle = { color: "var(--dsw-alias-state-success-primary)" };
		var badStyle = { color: "var(--dsw-alias-state-error-primary)" };
		var warnStyle = { color: "var(--dsw-alias-state-warn-primary)" };
		var mutedStyle = { opacity: 0.75 };
		function BalanceDock() {
			var state = React.useState({ kind: "loading" });
			var view = state[0];
			var setView = state[1];
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
				var id = setInterval(refresh, 30000);
				return function () { clearInterval(id); };
			}, [refresh]);
			if (view.kind === "loading") {
				return React.createElement("div", { style: dockStyle }, "API 余额查询中…");
			}
			if (view.kind === "error") {
				return React.createElement("div", { style: dockStyle, title: String(view.error) },
					React.createElement("span", { style: badStyle }, "API 余额获取失败"),
					React.createElement("span", { style: mutedStyle }, String(view.error)));
			}
			var data = view.data;
			if (!data || data.ok !== true || !Array.isArray(data.balances) || data.balances.length === 0) {
				var emptyError = String((data && data.error) || "empty response");
				return React.createElement("div", { style: dockStyle, title: emptyError },
					React.createElement("span", { style: badStyle }, "API 余额获取失败"),
					React.createElement("span", { style: mutedStyle }, emptyError));
			}
			var children = [React.createElement("span", { key: "label" }, "API 余额")];
			for (var i = 0; i < data.balances.length; i++) {
				var b = data.balances[i];
				children.push(React.createElement("span", { key: b.currency || "cur", style: amtStyle }, b.currency + " " + b.total));
			}
			children.push(data.isAvailable
				? React.createElement("span", { key: "avail", style: okStyle }, "可用")
				: React.createElement("span", { key: "avail", style: badStyle }, "不可用"));
			if (view.stale) {
				children.push(React.createElement("span", { key: "stale", style: warnStyle, title: String(view.error) }, "刷新失败"));
			}
			var updated = data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : "";
			children.push(React.createElement("span", { key: "time", style: mutedStyle }, updated ? updated + " 更新" : ""));
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
