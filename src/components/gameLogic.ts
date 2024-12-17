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

    // If there are cards from the previous round, handle them first
    if (newState.playerCard && newState.cpuCard) {
        if (newState.playerCard.rank > newState.cpuCard.rank) {
            // Player wins - add both cards to player's deck
            newState.playerDeck.push(newState.playerCard, newState.cpuCard);
            if (newState.warPile.length > 0) {
                newState.playerDeck.push(...newState.warPile);
                newState.warPile = [];
            }
            newState.message = "You win this round!";
        } else if (newState.cpuCard.rank > newState.playerCard.rank) {
            // CPU wins - add both cards to CPU's deck
            newState.cpuDeck.push(newState.playerCard, newState.cpuCard);
            if (newState.warPile.length > 0) {
                newState.cpuDeck.push(...newState.warPile);
                newState.warPile = [];
            }
            newState.message = "CPU wins this round!";
        }
        // Clear the played cards
        newState.playerCard = null;
        newState.cpuCard = null;
    }

    // Draw new cards if none are currently played
    if (!newState.playerCard && !newState.cpuCard) {
        if (newState.isWar) {
            // Handle war - each player puts 3 cards face down
            for (let i = 0; i < 3 && newState.playerDeck.length > 1 && newState.cpuDeck.length > 1; i++) {
                const playerWarCard = newState.playerDeck.shift();
                const cpuWarCard = newState.cpuDeck.shift();
                if (playerWarCard && cpuWarCard) {
                    newState.warPile.push(playerWarCard, cpuWarCard);
                }
            }
            newState.isWar = false;
        }

        // Draw the face-up cards
        newState.playerCard = newState.playerDeck.shift() || null;
        newState.cpuCard = newState.cpuDeck.shift() || null;

        // Check for war
        if (newState.playerCard && newState.cpuCard && 
            newState.playerCard.rank === newState.cpuCard.rank) {
            newState.isWar = true;
            newState.warPile.push(newState.playerCard, newState.cpuCard);
            newState.message = "WAR! Draw again for war cards!";
            newState.playerCard = null;
            newState.cpuCard = null;
        }
    }

    // Check for game over should happen after all card movements are complete
    // and should only trigger when one player has ALL 52 cards
    const totalPlayerCards = newState.playerDeck.length + 
                            (newState.playerCard ? 1 : 0) + 
                            (newState.isWar ? newState.warPile.length / 2 : 0);

    const totalCPUCards = newState.cpuDeck.length + 
                          (newState.cpuCard ? 1 : 0) + 
                          (newState.isWar ? newState.warPile.length / 2 : 0);

    // Game is only over when one player has all 52 cards
    if (totalPlayerCards === 52) {
        newState.gameOver = true;
        newState.message = "Game Over - You Win!";
    } else if (totalCPUCards === 52) {
        newState.gameOver = true;
        newState.message = "Game Over - CPU Wins!";
    }

    // Verify total cards equals 52
    const totalCards = newState.playerDeck.length + newState.cpuDeck.length + 
                      newState.warPile.length + 
                      (newState.playerCard ? 1 : 0) + 
                      (newState.cpuCard ? 1 : 0);
                      
    if (totalCards !== 52) {
        console.error('Card count error:', totalCards);
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