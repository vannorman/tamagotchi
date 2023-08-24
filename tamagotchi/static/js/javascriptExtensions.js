Number.prototype.toInterval = function (interval) {
  // Calculate the rounded value based on the interval
  const roundedValue = Math.round(this / interval) * interval;
  return roundedValue;
};

