import {
	App,
	Editor,
	MarkdownView,
	// Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface TogglePluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: TogglePluginSettings = {
	mySetting: "default",
};

export default class TogglePlugin extends Plugin {
	settings: TogglePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "toggle-link-format-command",
			name: "Toggle link format command",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "q" }],
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView
			) => {
				const sel = editor.getSelection();

				if (isValidMarkdownOrWikiLink(sel)) {
					if (!checking) {
						console.log(`You have selected: ${sel}`);
						console.log(
							`Toggled text: ${toggleWikiLinkAndMarkdown(sel)}`
						);
						editor.replaceSelection(toggleWikiLinkAndMarkdown(sel));
					}
					return true;
				}

				return false;
			},
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: TogglePlugin;

	constructor(app: App, plugin: TogglePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}

// ************************ utils ************************
function toggleWikiLinkAndMarkdown(text: string) {
	if (/\!\[.*?\]\(.*?\)/.test(text) || /\[.*?\]\(.*?\)/.test(text)) {
		// convert Markdown to WikiLink
		text = text.replace(/\!\[(.*?)\]\((.*?)\)/g, (match, altText, url) => {
			const decodedUrl = decodeURIComponent(url.trim());
			return `![[${decodedUrl}|${altText.trim()}]]`;
		});
		text = text.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, url) => {
			const decodedUrl = decodeURIComponent(url.trim());
			return `[[${decodedUrl}|${linkText.trim()}]]`;
		});
	} else {
		// convert WikiLink to Markdown
		text = text.replace(
			/!\[\[(.*?)(\|(.*?))?\]\]/g,
			(match, url, pipe, altText) => {
				const encodedUrl = encodeURI(url.trim());
				return `![${(altText || url).trim()}](${encodedUrl})`;
			}
		);
		text = text.replace(
			/\[\[(.*?)(\|(.*?))?\]\]/g,
			(match, url, pipe, linkText) => {
				const encodedUrl = encodeURI(url.trim());
				return `[${(linkText || url).trim()}](${encodedUrl})`;
			}
		);
	}
	return text;
}

function isValidMarkdownOrWikiLink(text: string): boolean {
	//  ![alt text](url)
	const markdownImagePattern = /!\[[^\[\]]*?\]\([^\(\)]+?\)/;

	// [text](url)
	const markdownLinkPattern = /\[[^\[\]]*?\]\([^\(\)]+?\)/;

	//  ![[filename]]
	const wikiImagePattern = /!\[\[[^\[\]]+?\]\]/;

	// [[filename]]
	const wikiLinkPattern = /\[\[[^\[\]]+?\]\]/;

	return (
		markdownImagePattern.test(text) ||
		markdownLinkPattern.test(text) ||
		wikiImagePattern.test(text) ||
		wikiLinkPattern.test(text)
	);
}
