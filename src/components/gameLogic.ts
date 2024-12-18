export interface Card {
    rank: number;
    suit: string;
    display: string;
    symbol: string;
}
  
export interface LocalState {
    playerDeck: Card[];
    cpuDeck: Card[];
    playerCard: Card | null;
    cpuCard: Card | null;
    warPile: Card[];
    isWar: boolean;
    gameOver: boolean;
    message: string;
    playerHasNuke: boolean;
    cpuHasNuke: boolean;
    isNukeActive: boolean;
    readyForNextCard: boolean;
}
  
export function createDeck(): Card[] {
    const suits = ['♠️', '♣️', '♥️', '♦️'];
    const ranks = Array.from({ length: 13 }, (_, i) => i + 2);
    const displayRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
        ranks.forEach((rank, i) => {
            const actualRank = displayRanks[i] === 'A' ? 14 : rank;
            deck.push({
                rank: actualRank,
                suit,
                display: displayRanks[i],
                symbol: `${displayRanks[i]}${suit}`
            });
        });
    }
    return shuffle(deck);
}
  
export function initializeGame(): LocalState {
    const deck = createDeck();
    const midpoint = Math.floor(deck.length / 2);
    return {
        playerDeck: deck.slice(0, midpoint),
        cpuDeck: deck.slice(midpoint),
        playerCard: null,
        cpuCard: null,
        warPile: [],
        isWar: false,
        gameOver: false,
        message: 'Draw a card to begin',
        playerHasNuke: true,
        cpuHasNuke: true,
        isNukeActive: false,
        readyForNextCard: false
    };
}
  
function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = newArray[i]!;
        newArray[i] = newArray[j]!;
        newArray[j] = temp;
    }
    return newArray;
}
  
export function drawCards(state: LocalState): LocalState {
    const newState = {
        ...state,
        playerDeck: [...state.playerDeck],
        cpuDeck: [...state.cpuDeck],
        warPile: [...state.warPile]
    };

    if (!newState.playerCard && !newState.cpuCard) {
        newState.playerCard = newState.playerDeck.shift() || null;
        newState.cpuCard = newState.cpuDeck.shift() || null;
        
        if (newState.playerCard && newState.cpuCard) {
            const playerRank = newState.playerCard.rank;
            const cpuRank = newState.cpuCard.rank;
            
            if (playerRank > cpuRank) {
                if (newState.warPile.length > 0) {
                    newState.message = `You win WAR with ${newState.playerCard.display}${newState.playerCard.suit}! (8 cards won)`;
                    newState.playerDeck.push(...newState.warPile);
                    newState.warPile = [];
                } else {
                    newState.message = `You wins with ${newState.playerCard.display}${newState.playerCard.suit}`;
                }
                newState.playerDeck.push(newState.cpuCard, newState.playerCard);
                newState.readyForNextCard = true;
            } else if (cpuRank > playerRank) {
                if (newState.warPile.length > 0) {
                    newState.message = `CPU wins WAR with ${newState.cpuCard.display}${newState.cpuCard.suit}! (8 cards won)`;
                    newState.cpuDeck.push(...newState.warPile);
                    newState.warPile = [];
                } else {
                    newState.message = `CPU wins with ${newState.cpuCard.display}${newState.cpuCard.suit}`;
                }
                newState.cpuDeck.push(newState.playerCard, newState.cpuCard);
                newState.readyForNextCard = true;
            } else {
                newState.message = "WAR! 3 cards each drawn";
                newState.isWar = true;
                
                if (newState.playerDeck.length >= 3 && newState.cpuDeck.length >= 3) {
                    for (let i = 0; i < 3; i++) {
                        newState.warPile.push(newState.playerDeck.shift()!);
                        newState.warPile.push(newState.cpuDeck.shift()!);
                    }
                    newState.warPile.push(newState.playerCard, newState.cpuCard);
                } else {
                    newState.gameOver = true;
                    newState.message = newState.playerDeck.length < 3 
                        ? "Game Over - Not enough cards for WAR! CPU wins!" 
                        : "Game Over - Not enough cards for WAR! You win!";
                }
                newState.playerCard = null;
                newState.cpuCard = null;
            }
        }
    }

    return newState;
}
  
export function handleNuke(state: LocalState, initiator: 'player' | 'cpu'): LocalState {
    const newState = {
        ...state,
        playerDeck: [...state.playerDeck],
        cpuDeck: [...state.cpuDeck]
    };
    
    if (initiator === 'player' && newState.playerHasNuke && newState.cpuDeck.length >= 10) {
        const stolenCards = newState.cpuDeck.splice(-10, 10);
        newState.playerDeck.unshift(...stolenCards);
        newState.playerHasNuke = false;
        newState.isNukeActive = true;
        newState.message = "NUKE LAUNCHED! You stole 10 cards!";
    } else if (initiator === 'cpu' && newState.cpuHasNuke && newState.playerDeck.length >= 10) {
        const stolenCards = newState.playerDeck.splice(-10, 10);
        newState.cpuDeck.unshift(...stolenCards);
        newState.cpuHasNuke = false;
        newState.isNukeActive = true;
        newState.message = "CPU LAUNCHED A NUKE! You lost 10 cards";
    }
    
    return newState;
} 