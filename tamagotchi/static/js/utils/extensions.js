PickRandomFromObject = function(obj){ 
    const index = Math.round(Math.random()*(Object.keys(obj).length-1));
    console.log("pick rand from:"+obj+", index:"+index);
    return obj[Object.keys(obj)[index]];
}

Array.prototype.removeRandom = function (count) {
  const selectedElements = [];
  const arrCopy = this.slice();

  while (selectedElements.length < count && arrCopy.length > 0) {
    const randomIndex = Math.floor(Math.random() * arrCopy.length);
    const selectedElement = arrCopy.splice(randomIndex, 1)[0];
    selectedElements.push(selectedElement);
  }

  return selectedElements;
};


