var uuid = require('uuid');
var SAT = require('sat');

var MAX_TRIALS = 10;

var COIN_DEFAULT_RADIUS = 10;
var COIN_DEFAULT_VALUE = 1;

var CoinManager = function (options) {
  this.cellData = options.cellData;

  var cellBounds = options.cellBounds;
  this.cellBounds = cellBounds;
  this.cellX = cellBounds.minX;
  this.cellY = cellBounds.minY;
  this.cellWidth = cellBounds.maxX - cellBounds.minX;
  this.cellHeight = cellBounds.maxY - cellBounds.minY;

  this.playerNoDropRadius = options.playerNoDropRadius;
  this.coinMaxCount = options.coinMaxCount;
  this.coinDropInterval = options.coinDropInterval;
  this.coinRadius = options.coinRadius || COIN_DEFAULT_RADIUS;

  this.coins = {};
  this.coinCount = 0;
};

CoinManager.prototype.generateRandomAvailablePosition = function (coinRadius) {
  var coinDiameter = coinRadius * 2;
  var circles = [];

  var players = this.cellData.player;

  for (var i in players) {
    var curPlayer = players[i];
    circles.push(new SAT.Circle(new SAT.Vector(curPlayer.x, curPlayer.y), this.playerNoDropRadius));
  }

  var position = null;

  for (var j = 0; j < MAX_TRIALS; j++) {
    var tempPosition = {
      x: this.cellX + Math.round(Math.random() * (this.cellWidth - coinDiameter) + coinRadius),
      y: this.cellY + Math.round(Math.random() * (this.cellHeight - coinDiameter) + coinRadius)
    }

    var tempPoint = new SAT.Vector(tempPosition.x, tempPosition.y);

    var validPosition = true;
    for (var k = 0; k < circles.length; k++) {
      if (SAT.pointInCircle(tempPoint, circles[k])) {
        validPosition = false;
        break;
      }
    }
    if (validPosition) {
      position = tempPosition;
      break;
    }
  }
  return position;
};

CoinManager.prototype.addCoin = function (value, radius) {
  radius = radius || this.coinRadius;
  var coinId = uuid.v4();
  var validPosition = this.generateRandomAvailablePosition(radius);
  var coin = {
    id: coinId,
    type: 'coin',
    v: value || COIN_DEFAULT_VALUE,
    r: radius,
    x: validPosition.x,
    y: validPosition.y
  };
  this.coins[coinId] = coin;
  return coin;
};

CoinManager.prototype.removeCoin = function (coinId) {
  if (this.coins[coinId]) {
    delete this.coins[coinId];
    this.coinCount--;
  }
};

CoinManager.prototype.doesPlayerTouchCoin = function (coinId, player) {
  var coin = this.coins[coinId];
  if (!coin) {
    return false;
  }
  var playerCircle = new SAT.Circle(new SAT.Vector(player.x, player.y), Math.ceil(player.width / 2));
  var coinCircle = new SAT.Circle(new SAT.Vector(coin.x, coin.y), coin.r);
  return SAT.testCircleCircle(playerCircle, coinCircle);
};

module.exports.CoinManager = CoinManager;
