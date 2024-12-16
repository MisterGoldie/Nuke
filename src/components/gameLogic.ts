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
        message: 'Draw a card to begin!'
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
        for (let i = 0; i < 3; i++) {
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
    if (newState.playerDeck.length === 0 || newState.cpuDeck.length === 0) {
        newState.gameOver = true;
        newState.message = newState.playerDeck.length === 0 ? "Game Over - CPU Wins!" : "Game Over - You Win!";
    }

    return newState;
} 