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
}
  
export function createDeck(): Card[] {
    const suits = ['♠️', '♣️', '♥️', '♦️'];
    const ranks = Array.from({ length: 13 }, (_, i) => i + 2);
    const displayRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
        ranks.forEach((rank, i) => {
            deck.push({
                rank,
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
        message: 'Draw a card to begin!',
        playerHasNuke: true,
        cpuHasNuke: true,
        isNukeActive: false
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
    const newState = { ...state };

    // Validate card counts
    const totalCards = newState.playerDeck.length + 
                      newState.cpuDeck.length + 
                      newState.warPile.length + 
                      (newState.playerCard ? 1 : 0) + 
                      (newState.cpuCard ? 1 : 0);

    if (totalCards !== 52) {
        console.error('Invalid card count:', totalCards);
        return initializeGame(); // Reset if counts are wrong
    }

    if (!newState.isWar) {
        newState.playerCard = newState.playerDeck.pop() || null;
        newState.cpuCard = newState.cpuDeck.pop() || null;

        if (newState.playerCard && newState.cpuCard) {
            if (newState.playerCard.rank === newState.cpuCard.rank) {
                newState.isWar = true;
                newState.warPile.push(newState.playerCard, newState.cpuCard);
                newState.message = "WAR! Draw again for war cards!";
            } else {
                const winner = newState.playerCard.rank > newState.cpuCard.rank ? 'player' : 'cpu';
                if (winner === 'player') {
                    newState.playerDeck.unshift(newState.playerCard, newState.cpuCard);
                    if (newState.warPile.length > 0) {
                        newState.playerDeck.unshift(...newState.warPile);
                        newState.warPile = [];
                    }
                    newState.message = "You win this round!";
                } else {
                    newState.cpuDeck.unshift(newState.playerCard, newState.cpuCard);
                    if (newState.warPile.length > 0) {
                        newState.cpuDeck.unshift(...newState.warPile);
                        newState.warPile = [];
                    }
                    newState.message = "CPU wins this round!";
                }
            }
        }
    } else {
        // Handle war
        for (let i = 0; i < 3 && newState.playerDeck.length > 0 && newState.cpuDeck.length > 0; i++) {
            const playerWarCard = newState.playerDeck.pop();
            const cpuWarCard = newState.cpuDeck.pop();
            if (playerWarCard && cpuWarCard) {
                newState.warPile.push(playerWarCard, cpuWarCard);
            }
        }
        newState.isWar = false;
        newState.message = "War cards drawn! Draw again to resolve!";
    }

    // Check for game over
    if (newState.playerDeck.length === 52) {
        newState.gameOver = true;
        newState.message = "Game Over - You Win! You've captured all cards!";
    } else if (newState.cpuDeck.length === 52) {
        newState.gameOver = true;
        newState.message = "Game Over - CPU Wins! They've captured all cards!";
    }

    return newState;
} 

export function handleNuke(state: LocalState, initiator: 'player' | 'cpu'): LocalState {
    const newState = { ...state };
    
    if (initiator === 'player' && newState.playerHasNuke && newState.cpuDeck.length >= 10) {
        // Player initiates nuke
        const stolenCards = newState.cpuDeck.splice(-10);
        newState.playerDeck.unshift(...stolenCards);
        newState.playerHasNuke = false;
        newState.message = "NUKE LAUNCHED! You stole 10 cards!";
        newState.isNukeActive = true;
    } else if (initiator === 'cpu' && newState.cpuHasNuke && newState.playerDeck.length >= 10) {
        // CPU initiates nuke
        const stolenCards = newState.playerDeck.splice(-10);
        newState.cpuDeck.unshift(...stolenCards);
        newState.cpuHasNuke = false;
        newState.message = "CPU LAUNCHED A NUKE! Lost 10 cards!";
        newState.isNukeActive = true;
    }

    return newState;
} 