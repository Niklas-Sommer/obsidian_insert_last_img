import { App, MarkdownView, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'Images'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'insert-latest-image-command',
			name: 'Insert Latest Image',
			editorCheckCallback: (checking, editor, ctx) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						const folder = this.app.vault.getFolderByPath(this.settings.mySetting);
						if (folder) {
							let file: any = null;
							let maxTime = 0;
							folder.children.every((value: TAbstractFile, index: number, array: TAbstractFile[]) => {
								if (value instanceof TFile) {
									if (value.stat.ctime > maxTime) {
										file = value;
										maxTime = value.stat.ctime;
									}
								}

								return true;
							});

							if (file instanceof TFile) {
								editor.replaceSelection(this.app.fileManager.generateMarkdownLink(file, file.path) + "\n");
								const cursor = editor.getCursor();
								cursor.line += 1;
								editor.setCursor(cursor);
							}
						}
					}

					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Image Folger')
			.setDesc('From this folder the last image will be inserted at the current cursor position.')
			.addText(text => text
				.setPlaceholder('Images')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					// Replace all leading and trailing /
					this.plugin.settings.mySetting = value.replace(/^\/+|\/+$/g, '');
					await this.plugin.saveSettings();
				}));
	}
}
