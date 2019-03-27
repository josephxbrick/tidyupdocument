// figure out if arboards are laid out horizontally or vertically.
// assumes no artboads overlap.
function getOrientation(artboards){
	if (artboards.length == 1){
		return 'horizontal';
	} else {
		let widthSum = 0;
		let minX = Number.MAX_SAFE_INTEGER;
		let maxX = Number.MIN_SAFE_INTEGER;
		for (let i = 0; i < artboards.length; i++){
			let artboard = artboards[i];
			widthSum += artboard.frame().width();
			let left = artboard.frame().x();
			let right = artboard.frame().x() + artboard.frame().width();
			minX = Math.min(left, minX);
			maxX = Math.max(right, maxX);
		}
		let delta = Math.max(minX,maxX) - Math.min(minX,maxX);
		if (delta >= widthSum) {
			return 'horizontal';
		} else {
			return 'vertical'
		}
	}
}

// sort artboads by horizontal or vertical position
function sortArtboardsByLayout(artboards){
  let orientation = getOrientation(artboards);
  if (orientation == 'horizontal'){
    artboards.sort((a, b) => a.frame().x() - b.frame().x());
  } else if (orientation == 'vertical'){
    artboards.sort((a, b) => a.frame().y() - b.frame().y());
  }
}
