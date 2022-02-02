## Q: Hoe kan je threejs gebruiken om een interactieve digitale kaart met 3D gebouwen te tonen die een pad van een rondleiding visualiseert?

A: Get GeoJson data, process it and created meshed out of it that you can show and animate with three.js

## Q: Waar vind je opensource 2- en/of 3D-kaartgegevens

A: these links
https://openstreetmaps.org
https://overpass-turbo.eu
https://3dbuildings.com (used to be https://osmbuildings.org/ but rebranded and free version not yet available)

## Q: Hoe kun je de verschillende formaten in threejs importeren en gebruiken? (converteren, native, ...)

A: you don't need multiple formats, as you can export the data in geojson. This is basically just a collection of points (longitude/lattitude) in a specific order. You can process them and a 2D shape from them that you can subsequently extrude.

## Q: Kan je 3D-gebouwen genereren op basis van een 2D-kaart?

A: yes, OSM provides height data of the buildings which you can use to set the extrude amount.

## Q: Hoe kan ik de details van de kaart afstemmen op de mogelijkheden van het device van de gebruiker zodat de ervaring performant blijft

A: it ended up not being neccesary to implement, but you can create a script that checks how much FPS three.js is getting, and change the render-resolution accordingly until the fps is in an acceptable range.

## Q: Hoe genereer ik een pad op de kaart zodat die de wegen gebruikt en geen rechte lijn tussen 2 punten tekent?

A: Wanneer je de muis raycast, check enkel de wegen en niets anders. Zo kan je enkel punten zetten op de weg.
