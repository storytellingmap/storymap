# INSTALLATION MANUAL

## Setup

create a new vinally project with vite.

```sh
npm init vite@latest
```

Install the storymap package using npm:

```sh
npm install https://github.com/elfensky/storymap
```

Edit your html to contain:

```html
<div id="shortcuts" class="shortcuts">
	<ul>
		<li>
			Press <span class="keyboardButton">S</span> to save path to file
		</li>
		<li>Press <span class="keyboardButton">R</span> to reset</li>
		<li>Press <span class="keyboardButton">Z</span> to reset</li>
		<li>Press <span class="keyboardButton">X</span> to redo</li>
	</ul>
</div>
<span id="scrollProgress"></span>

<div id="container"></div>
```

Edit your main.js

```js
import * as storymaps from "storymap";
storymaps.setup();
```

Now run the project using vite

```
npm run dev
```
