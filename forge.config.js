module.exports = {
	packagerConfig: {
		asar: true,
		icon: "./src/assets/icons/icon",
		platform: ["win32", "darwin", "linux"],
        arch: ["x64", "arm64"],
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				iconUrl: "https://res.cloudinary.com/dcwz20wdd/image/upload/v1692345162/icon_mb9i9o.ico",
				setupIcon: "./src/assets/icons/icon.ico",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {
				options: {
					icon: "./src/assets/icons/icon.png",
				},
			},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {},
		},
		{
			// Path to the icon to use for the app in the DMG window
			name: "@electron-forge/maker-dmg",
			config: {
				icon: "./src/assets/icons/icon.icns",
			},
		},
	],
	plugins: [
		{
			name: "@electron-forge/plugin-auto-unpack-natives",
			config: {},
		},
	],
};
