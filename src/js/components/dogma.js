import renderCard from '../cards/renderCard';
import getCardElement from '../cards/getCardElement';
import getCardObject from '../cards/getCardObject';
import gameState from './gameState';
import gameBoard from './gameBoard';
import header from '../display/playerTable/displayHeader';

const isAge = (cardID, age) => getCardObject.byID(cardID).age === age;

function moveCardToHand(card, id) {
  gameState.players[id].hand.push(card);
  if (id === gameState.currentPlayer.id) {
    const currentCard = getCardObject.byID(card);
    const cardElement = getCardElement(currentCard);
    renderCard.toHand(cardElement);
    cardElement.onclick = gameBoard.playCard;
  }
}

function getMaxCard(stack) {
  let result = null;
  if (stack.length > 0) {
    result = getCardObject.byID(stack[0]);
    for (let i = 0; i < stack.length; i += 1) {
      const currentCard = getCardObject.byID(stack[i]);
      if (result.age < currentCard.age) {
        result = currentCard;
      }
    }
  }
  return result;
// take e as argument!!!
function getCardAge(e) {
  let cardElement = null;
  let cardObject = null;
  if (e.target) {
    cardElement = e.target.closest('.card');
    cardObject = getCardObject.byID(cardElement.dataset.innovation);
    return cardObject.age;
  }
  return false;
}

function getActualDeck(startAge) {
  let actualAge = -1;
  for (let i = startAge; i < 11; i += 1) {
    if (gameState.ageDecks[`age${i}`].length > 0) {
      actualAge = i;
      break;
    }
  }
  return actualAge;
}

function isHaveResource(cardObj, res) {
  let result = false;
  cardObj.resourses.forEach((item) => {
    if (item.name === res) {
      result = true;
    }
  });
  return result;
}

function getAffectedPlayers(cardObj) {
  const res = cardObj.dogma[0].resource;
  let idPlayers;
  if (cardObj.dogma[0].type === 'corporate') {
    idPlayers = gameState.players.filter((player) => player[res] >= gameState.currentPlayer[res])
      .map((player) => player.id);

    const currentPlayerID = idPlayers.splice(gameState.currentPlayer.id, 1);
    idPlayers.push(currentPlayerID);
  } else {
    idPlayers = gameState.players
      .filter((player) => {
        const pl = player[res] < gameState.currentPlayer[res] && player !== gameState.currentPlayer;
        return pl;
      }).map((player) => player.id);
  }
  return idPlayers.flat();
}

function takeCard(cardsNum, ageNum, playerID, render = true) {
  while (cardsNum > 0) {
    const actualAge = getActualDeck(ageNum);
    const cardID = gameState.ageDecks[`age${actualAge}`].pop();
    gameState.players[playerID].hand.push(cardID);
    cardsNum -= 1;
    if (gameState.players[playerID] === gameState.activePlayer) {
      const cardObj = getCardObject.byID(cardID);
      const cardElement = getCardElement(cardObj);
      cardElement.onclick = gameBoard.playCard;
      if (render) renderCard.toHand(cardElement);
    }
  }
}

function playCard(cardID, playerID) {
  const cardIndex = gameState.players[playerID].hand.indexOf(cardID);
  if (cardIndex > -1) {
    gameState.players[playerID].hand.splice(cardIndex, 1);
  }
  const cardObj = getCardObject.byID(cardID);
  const cardElement = getCardElement(cardObj);
  const renderedCard = document.querySelector(`[data-innovation='${cardID}']`);
  if (renderedCard !== null) renderedCard.remove();
  const targetStack = gameState.players[playerID].activeDecks[cardObj.color].cards;
  targetStack.push(cardID);
  if (gameState.players[playerID] === gameState.currentPlayer) {
    cardElement.onclick = () => dogmas['письменность'](cardObj); //! change later
    renderCard.toActive(cardElement);
  }
}

function recycle(playerID, arrCardID) {
  const cardObjs = {};
  for (let id = 0; id < arrCardID.length; id += 1) {
    cardObjs[arrCardID[id]] = getCardObject.byID(arrCardID[id]).age;

    const indexCard = gameState.players[playerID].hand.indexOf(arrCardID[id]);
    const cardID = gameState.players[playerID].hand[indexCard];

    if (!cardID) return;

    gameState.ageDecks[`age${cardObjs[arrCardID[id]]}`].unshift(cardID);
    gameState.players[playerID].hand.splice(indexCard, 1);
  }
  // gameBoard.display();
}

function corporateBonus(arrOfId) {
  if (arrOfId.length > 1) {
    takeCard(1, gameState.currentPlayer.currentAge, gameState.currentPlayer.id);
  }
}

const getManualDogma = function closureWrapper() {
  // store current action points
  gameState.storedActionPoints = gameState.activePlayer.actionPoints;
  let soloCorporate = false;
  if (gameState.affectedPlayers.length === 1
    && gameState.affectedPlayers[0] === gameState.currentPlayer.id) {
    soloCorporate = true;
  }
  let corporateCard = false;

  function setManualDogma(listener, getCardsID, count) {
    // change active players while find one with not null affected cards array
    let arrOfCardsID = null;
    do {
      gameState.activePlayer = gameState.players[gameState.affectedPlayers.pop()];
      arrOfCardsID = getCardsID();
    } while (arrOfCardsID.length === 0 && gameState.affectedPlayers.length >= 1);

    if (arrOfCardsID.length > 0) {
      if (gameState.activePlayer !== gameState.currentPlayer) {
        gameState.activePlayer.actionPoints = count + 1;
        corporateCard = true;
      } else if (soloCorporate) {
        gameState.activePlayer.actionPoints = gameState.storedActionPoints + count;
      } else {
        gameState.activePlayer.actionPoints = gameState.storedActionPoints + count - 1;
      }

      alert(`Дейтсвие игрока ${gameState.activePlayer.name}`);
      gameBoard.display();
      gameBoard.setHeaderCurrent();
      arrOfCardsID.forEach((cardID) => {
        document.querySelector(`[data-innovation='${cardID}']`).onclick = (e) => {
          listener(e);
          if (gameState.activePlayer.actionPoints - 1 <= 0 && gameState.storedActionPoints !== 1
          && gameState.activePlayer === gameState.currentPlayer) {
            Array.from(document.querySelectorAll('.active')).forEach((elem) => {
              elem.classList.remove('active');
            });
            if (gameState.activePlayer === gameState.currentPlayer
              && gameState.activePlayer.actionPoints !== 0) {
              gameBoard.init();
              if (corporateCard) {
                takeCard(1, gameState.activePlayer.currentAge, gameState.activePlayer.id);
                header.changePlayerStats(gameState.currentPlayer);
              }
            }
          } else if (gameState.activePlayer.actionPoints === 0) {
            Array.from(document.querySelectorAll('.active')).forEach((elem) => {
              elem.classList.remove('active');
            });
            if (gameState.activePlayer === gameState.currentPlayer
              && gameState.activePlayer.actionPoints !== 0) {
              gameBoard.init();
              if (corporateCard) {
                takeCard(1, gameState.activePlayer.currentAge, gameState.activePlayer.id);
                header.changePlayerStats(gameState.currentPlayer);
              }
            }
          }
        };
        document.querySelector(`[data-innovation='${cardID}']`).classList.add('active');
      });
      document.querySelector('.info-table').onclick = () => {
        if (gameState.activePlayer.actionPoints === 0) {
          const nextActionBtn = document.querySelector('.info-table__next-turn-btn');
          if (nextActionBtn !== null) nextActionBtn.remove();
          if (gameState.activePlayer.actionPoints === 0 && gameState.affectedPlayers.length !== 0) {
            setManualDogma(listener, getCardsID, count);
          } else if (gameState.affectedPlayers.length === 0) {
            gameState.activePlayer = gameState.currentPlayer;
            gameBoard.display();
            gameBoard.init();
          }
        }
      };
    } else {
      alert('Догму нельзя использовать!');
      gameState.activePlayer.actionPoints += 1;
    }
  }

  return setManualDogma;
};

const dogmas = {
  письменность: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      takeCard(1, 2, id);
    });
    corporateBonus(arrOfId);
  },
  колесо: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      takeCard(2, 1, id);
    });
    corporateBonus(arrOfId);
  },
  парус: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      takeCard(1, 1, id, false);
      playCard(gameState.players[id].hand[gameState.players[id].hand.length - 1], id);
    });
    corporateBonus(arrOfId);
  },
  скотоводство: (cardObj) => {
    // get affected players
    gameState.affectedPlayers = getAffectedPlayers(cardObj);
    // function which get affected cards of active player
    // return empty arr if any properties dont match!
    function getAffectedCards() {
      const cardsFromHand = [];
      gameState.activePlayer.hand.forEach((cardID) => {
        cardsFromHand.push(getCardObject.byID(cardID));
      });
      const lowerCards = cardsFromHand.sort((a, b) => b.age - a.age).filter((card, i, arr) => {
        return card.age === arr[arr.length - 1].age;
      });
      const lowerCardsID = lowerCards.map((cardObject) => cardObject.innovation);
      return lowerCardsID;
    }
    function listener(e) {
      takeCard(1, gameState.activePlayer.currentAge, gameState.activePlayer.id);
      gameBoard.playCard(e);
    }
    getManualDogma()(listener, getAffectedCards, 1);
  },

  кузнечноедело: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      let repeat = true;
      do {
        const actualAge = getActualDeck(1);
        const cardID = gameState.ageDecks[`age${actualAge}`].pop();
        const currentPlayerName = gameState[`player${id}`].name;
        console.log(`${currentPlayerName} взял ${cardID}`);
        const currentCard = getCardObject.byID(cardID);
        repeat = isHaveResource(currentCard, 'tower');
        if (repeat) {
          gameState.players[id].influence.cards.push(cardID);
        } else {
          moveCardToHand(cardID, id);
        }
      } while (repeat);
    });
    corporateBonus(arrOfId);
  },
  мистицизм: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      const actualAge = getActualDeck(1);
      const cardID = gameState.ageDecks[`age${actualAge}`].pop();
      const currentPlayerName = gameState[`player${id}`].name;
      const currentCard = getCardObject.byID(cardID);
      console.log(`${currentPlayerName} взял ${cardID} ${currentCard.color}`);
      if (gameState.players[id].activeDecks[currentCard.color].cards.length > 0) {
        gameState.players[id].activeDecks[currentCard.color].cards.push(cardID);
        if (id === gameState.currentPlayer.id) {
          const cardElement = getCardElement(currentCard);
          renderCard.toActive(cardElement);
          if (dogmas[currentCard.innovation]) {
            cardElement.onclick = () => dogmas[currentCard.innovation](cardObj);
          }
        }
      } else {
        moveCardToHand(cardID, id);
      }
    });
  },
  инструменты: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    let cardID = [];

    const actions = () => arrOfId.forEach((id) => {
      const cardsInHand = document.querySelector('.hand__cards').children;
      for (let i = 0; i < cardsInHand.length; i += 1) {
        cardsInHand[i].onclick = (e) => console.log(e.target.closest('.card').dataset.innovation);
      }
      recycle(id, cardID);

      if (cardID.length >= 3) {
        const lastCardInHand = gameState.players[id].hand[gameState.players[id].hand.length - 1];
        takeCard(1, 3, id, false);
        playCard(lastCardInHand, id);
      }
    });
    // for (let i = 0; i < 3; i += 1) {
    //   cardID.push(prompt('Назовите карту', ''));
    // }

    cardID = cardID.filter((item) => item !== null && item.length > 1);
    actions();

    cardID = [];

    // do {
    //   cardID[0] = prompt('Назовите карту 3 века', '');
    // } while (!isAge(cardID[0], 3) && cardID[0] !== null);
    if (cardID.length >= 1 && cardID[0] !== undefined) actions();

    corporateBonus(arrOfId);
  },
  инструменты: (cardObj) => { // TODO
    gameState.affectedPlayers = getAffectedPlayers(cardObj);
    function getAffectedCards() {
      const handOfCurrent = gameState.activePlayer.hand;
      let haveThirdAgeCard = false;
      handOfCurrent.forEach((cardID) => {
        if (getCardObject.byID(cardID).age === 3) haveThirdAgeCard = true;
      });
      if (handOfCurrent.length >= 3 || haveThirdAgeCard) {
        if (handOfCurrent.length >= 3) return handOfCurrent;
        const resArr = [];
        handOfCurrent.forEach((cardID) => {
          if (getCardObject(cardID).age === 3) resArr.push(cardID);
        });
        return resArr;
      }
      return [];
    }
    function listener(e) {
      if (getCardAge(e) === 3) {
        gameState.activePlayer.actionPoints -= 2;
      }
      gameBoard.playCard(e);//! change on recycle! Check is update inside recycle!
    }
    getManualDogma()(listener, getAffectedCards, 3);
  },

  кузнечноедело: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      let repeat = true;
      do {
        const actualAge = getActualDeck(1);
        const cardID = gameState.ageDecks[`age${actualAge}`].pop();
        const currentPlayerName = gameState[`player${id}`].name;
        console.log(`${currentPlayerName} взял ${cardID}`);
        const currentCard = getCardObject.byID(cardID);
        repeat = isHaveResource(currentCard, 'tower');
        if (repeat) {
          gameState.players[id].influence.cards.push(cardID);
        } else {
          moveCardToHand(cardID, id);
        }
      } while (repeat);
    });
    corporateBonus(arrOfId);
  },
  мистицизм: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      const actualAge = getActualDeck(1);
      const cardID = gameState.ageDecks[`age${actualAge}`].pop();
      const currentPlayerName = gameState[`player${id}`].name;
      const currentCard = getCardObject.byID(cardID);
      console.log(`${currentPlayerName} взял ${cardID} ${currentCard.color}`);
      if (gameState.players[id].activeDecks[currentCard.color].cards.length > 0) {
        gameState.players[id].activeDecks[currentCard.color].cards.push(cardID);
        if (id === gameState.currentPlayer.id) {
          const cardElement = getCardElement(currentCard);
          renderCard.toActive(cardElement);
          if (dogmas[currentCard.innovation]) {
            cardElement.onclick = () => dogmas[currentCard.innovation](cardObj);
          }
        }
      } else {
        moveCardToHand(cardID, id);
      }
    });
    corporateBonus(arrOfId);
  },
  виноделие: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      const numberOfCards = Math.trunc(gameState[`player${id}`].tree / 2);
      takeCard(numberOfCards, 2, id);
    });
    corporateBonus(arrOfId);
  },
  календарь: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      if (gameState[`player${id}`].influence.cards.length > gameState[`player${id}`].hand.length) {
        takeCard(2, 3, id);
      }
    });
    corporateBonus(arrOfId);
  },
  эксперименты: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      const actualAge = getActualDeck(5);
      const cardID = gameState.ageDecks[`age${actualAge}`].pop();
      playCard(cardID, id);
    });
    corporateBonus(arrOfId);
  },
  пароваямашина: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      for (let i = 0; i < 2; i += 1) {
        const actualAge = getActualDeck(4);
        const cardID = gameState.ageDecks[`age${actualAge}`].pop();
        const cardObject = getCardObject.byID(cardID);
        const cardElement = getCardElement(cardObject);
        const cardColor = cardObject.color;
        gameState[`player${id}`].activeDecks[cardColor].cards.unshift(cardID);
        if (gameState.currentPlayer.id === id) {
          renderCard.archive(cardElement);
        }
      }
      const lastYellowCardID = gameState[`player${id}`].activeDecks.yellow.cards.shift();
      gameState[`player${id}`].influence.cards.push(lastYellowCardID);
      const lastYellowCardElement = getCardElement(getCardObject.byID(lastYellowCardID));
      renderCard.removeCardFromActive(lastYellowCardElement);
    });
    corporateBonus(arrOfId);
  },
  станки: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      let currentAge = 1;
      const currentPlayer = gameState[`player${id}`];
      const maxCard = getMaxCard(currentPlayer.influence.cards);
      if (maxCard) {
        currentAge = maxCard.age;
      }
      currentAge = getActualDeck(currentAge);
      const currentCard = gameState.ageDecks[`age${currentAge}`].pop();
      currentPlayer.influence.cards.push(currentCard);
    });
    corporateBonus(arrOfId);
  },
  генетика: (cardObj) => {
    const arrOfId = getAffectedPlayers(cardObj);
    arrOfId.forEach((id) => {
      const currentPlayer = gameState[`player${id}`];
      const currentAge = getActualDeck(10);
      const currentCard = gameState.ageDecks[`age${currentAge}`].pop();
      const stackColor = getCardObject.byID(currentCard).color;
      playCard(currentCard, id);
      const currentDeck = currentPlayer.activeDecks[stackColor].cards;
      if (currentDeck.length > 1) {
        for (let i = 0; i < currentDeck.length - 1; i += 1) {
          const cardID = currentDeck[i];
          currentPlayer.influence.cards.push(cardID);
          renderCard.removeCardFromActive(getCardElement(getCardObject.byID(cardID)));
        }
        currentDeck.splice(0, currentDeck.length - 1);
      }
    });
    corporateBonus(arrOfId);
  },
};

export default dogmas;
