import { pickArtId } from '~/lib/crudeboysArt';

export interface Card {
    rank: number;
    suit: string;
    display: string;
    symbol: string;
    /** Crudeboys item id, e.g. "141" -> /crudeboys/141.webp */
    artId?: string;
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
    gameStartTime?: number;
    isWarBeingHandled?: boolean;
}

const EXPECTED_CARD_COUNT = 52;

export function cloneState(state: LocalState): LocalState {
    return {
        ...state,
        playerDeck: [...state.playerDeck],
        cpuDeck: [...state.cpuDeck],
        warPile: [...state.warPile],
    };
}

/** Every card lives in exactly one of: playerDeck, cpuDeck, playerCard, cpuCard, warPile. */
export function countAllCards(state: LocalState): number {
    return (
        state.playerDeck.length +
        state.cpuDeck.length +
        (state.playerCard ? 1 : 0) +
        (state.cpuCard ? 1 : 0) +
        state.warPile.length
    );
}

/**
 * HUD counts that always sum to countAllCards().
 * War pile is dealt [player, cpu, player, cpu, ...], so even indices belong to the player.
 */
export function getDisplayCounts(state: LocalState): { player: number; cpu: number } {
    let playerWar = 0;
    let cpuWar = 0;
    state.warPile.forEach((_, index) => {
        if (index % 2 === 0) playerWar += 1;
        else cpuWar += 1;
    });

    return {
        player: state.playerDeck.length + (state.playerCard ? 1 : 0) + playerWar,
        cpu: state.cpuDeck.length + (state.cpuCard ? 1 : 0) + cpuWar,
    };
}

function logCountIfBroken(state: LocalState, where: string): void {
    const total = countAllCards(state);
    if (total !== EXPECTED_CARD_COUNT) {
        console.error(`Card count ${total} (expected ${EXPECTED_CARD_COUNT}) at ${where}`, {
            playerDeck: state.playerDeck.length,
            cpuDeck: state.cpuDeck.length,
            playerCard: state.playerCard ? 1 : 0,
            cpuCard: state.cpuCard ? 1 : 0,
            warPile: state.warPile.length,
        });
    }
}

function applyGameOverIfEmpty(state: LocalState): LocalState {
    if (state.isWar || state.gameOver) {
        return state;
    }

    const counts = getDisplayCounts(state);
    if (counts.player === 0 || counts.cpu === EXPECTED_CARD_COUNT) {
        state.gameOver = true;
        state.message = "GAME OVER - CPU WINS!";
        state.readyForNextCard = false;
    } else if (counts.cpu === 0 || counts.player === EXPECTED_CARD_COUNT) {
        state.gameOver = true;
        state.message = "GAME OVER - YOU WIN!";
        state.readyForNextCard = false;
    }

    return state;
}

/** Move the two revealed cards into the winner's deck. No-op if nothing is in play. */
export function settleTrick(state: LocalState): LocalState {
    const next = cloneState(state);

    if (next.playerCard && next.cpuCard) {
        if (next.playerCard.rank > next.cpuCard.rank) {
            next.playerDeck.push(next.playerCard, next.cpuCard);
        } else if (next.cpuCard.rank > next.playerCard.rank) {
            next.cpuDeck.push(next.playerCard, next.cpuCard);
        } else {
            next.playerDeck.push(next.playerCard);
            next.cpuDeck.push(next.cpuCard);
        }
        next.playerCard = null;
        next.cpuCard = null;
    }

    next.readyForNextCard = false;
    const settled = applyGameOverIfEmpty(next);
    logCountIfBroken(settled, "settleTrick");
    return settled;
}

function pushAntePair(state: LocalState, downs: number): void {
    for (let i = 0; i < downs; i += 1) {
        const playerAnte = state.playerDeck.shift();
        const cpuAnte = state.cpuDeck.shift();
        if (playerAnte) state.warPile.push(playerAnte);
        if (cpuAnte) state.warPile.push(cpuAnte);
    }
}

function collectWarCards(state: LocalState): void {
    if (state.playerCard) {
        state.warPile.push(state.playerCard);
        state.playerCard = null;
    }
    if (state.cpuCard) {
        state.warPile.push(state.cpuCard);
        state.cpuCard = null;
    }
}

/** After the tied pair has been shown, deal 3 face-down and 1 face-up each. */
export function dealWarAnte(state: LocalState): LocalState {
    const next = cloneState(state);
    if (!next.playerCard || !next.cpuCard || next.warPile.length > 0) {
        return next;
    }

    collectWarCards(next);

    const dealRound = (): boolean => {
        if (next.playerDeck.length < 4 || next.cpuDeck.length < 4) {
            return false;
        }
        pushAntePair(next, 3);
        next.playerCard = next.playerDeck.shift() ?? null;
        next.cpuCard = next.cpuDeck.shift() ?? null;
        return Boolean(next.playerCard && next.cpuCard);
    };

    if (!dealRound()) {
        logCountIfBroken(next, "dealWarAnte:short");
        return next;
    }

    while (
        next.playerCard &&
        next.cpuCard &&
        next.playerCard.rank === next.cpuCard.rank &&
        next.playerDeck.length >= 4 &&
        next.cpuDeck.length >= 4
    ) {
        collectWarCards(next);
        if (!dealRound()) break;
    }

    logCountIfBroken(next, "dealWarAnte");
    return next;
}

export function resolveWarWinner(state: LocalState): "player" | "cpu" {
    if (state.playerCard && state.cpuCard) {
        if (state.playerCard.rank > state.cpuCard.rank) return "player";
        if (state.cpuCard.rank > state.playerCard.rank) return "cpu";
    }
    const counts = getDisplayCounts(state);
    return counts.player >= counts.cpu ? "player" : "cpu";
}

/** Give the real war pile (plus face-up war cards) to the winner. */
export function awardWarPile(state: LocalState, winner: "player" | "cpu"): LocalState {
    const next = cloneState(state);

    if (next.warPile.length === 0 && !next.isWar && !next.playerCard && !next.cpuCard) {
        next.readyForNextCard = false;
        return next;
    }

    collectWarCards(next);

    if (winner === "player") {
        next.playerDeck.push(...next.warPile);
    } else {
        next.cpuDeck.push(...next.warPile);
    }

    next.warPile = [];
    next.isWar = false;
    next.isWarBeingHandled = false;
    next.playerCard = null;
    next.cpuCard = null;
    next.readyForNextCard = true;
    next.message = "Draw next card to continue";

    const settled = applyGameOverIfEmpty(next);
    logCountIfBroken(settled, "awardWarPile");
    return settled;
}

/** Put in-play and war-pile cards back with their owners (timer / cancelled war). */
export function returnUnassignedToOwners(state: LocalState): LocalState {
    const next = cloneState(state);

    if (next.playerCard) {
        next.playerDeck.push(next.playerCard);
        next.playerCard = null;
    }
    if (next.cpuCard) {
        next.cpuDeck.push(next.cpuCard);
        next.cpuCard = null;
    }

    next.warPile.forEach((card, index) => {
        if (index % 2 === 0) next.playerDeck.push(card);
        else next.cpuDeck.push(card);
    });
    next.warPile = [];
    next.isWar = false;
    next.isWarBeingHandled = false;

    logCountIfBroken(next, "returnUnassignedToOwners");
    return next;
}

/** Collect every remaining card into the winner's deck so the total stays 52. */
export function declareWinner(
    state: LocalState,
    winner: "player" | "cpu",
    message: string,
): LocalState {
    const next = cloneState(state);
    const allCards = [
        ...next.playerDeck,
        ...next.cpuDeck,
        ...(next.playerCard ? [next.playerCard] : []),
        ...(next.cpuCard ? [next.cpuCard] : []),
        ...next.warPile,
    ];

    const result: LocalState = {
        ...next,
        playerDeck: winner === "player" ? allCards : [],
        cpuDeck: winner === "cpu" ? allCards : [],
        playerCard: null,
        cpuCard: null,
        warPile: [],
        isWar: false,
        isWarBeingHandled: false,
        isNukeActive: false,
        gameOver: true,
        readyForNextCard: false,
        message,
    };

    logCountIfBroken(result, "declareWinner");
    return result;
}

export function createDeck(): Card[] {
    const suits = ["♠️", "♣️", "♥️", "♦️"];
    const ranks = Array.from({ length: 13 }, (_, i) => i + 2);
    const displayRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck: Card[] = [];

    for (const suit of suits) {
        ranks.forEach((rank, i) => {
            const actualRank = displayRanks[i] === "A" ? 14 : rank;
            deck.push({
                rank: actualRank,
                suit,
                display: displayRanks[i],
                symbol: `${displayRanks[i]}${suit}`,
                artId: pickArtId(displayRanks[i], suit),
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
        warPile: [],
        gameOver: false,
        message: "",
        readyForNextCard: true,
        isWar: false,
        playerHasNuke: true,
        cpuHasNuke: true,
        isNukeActive: false,
        gameStartTime: Date.now(),
        playerCard: null,
        cpuCard: null,
        isWarBeingHandled: false,
    };
}

function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];

    // Modified Fisher-Yates shuffle with slight player advantage
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        if (i < newArray.length / 2 && Math.random() < 0.2) {
            continue;
        }
        const temp = newArray[i]!;
        newArray[i] = newArray[j]!;
        newArray[j] = temp;
    }

    return newArray;
}

function drawCpuCardAvoidingRank(state: LocalState, playerRank: number): void {
    const maxAttempts = state.cpuDeck.length;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const card = state.cpuDeck.shift();
        if (!card) break;
        if (card.rank !== playerRank) {
            state.cpuCard = card;
            return;
        }
        state.cpuDeck.push(card);
    }
    state.cpuCard = state.cpuDeck.shift() ?? null;
}

export function drawCards(state: LocalState): LocalState {
    const newState = cloneState(state);

    if (newState.playerDeck.length === 0 || newState.cpuDeck.length === 0) {
        const winner = newState.playerDeck.length > 0 ? "player" : "cpu";
        return declareWinner(
            newState,
            winner,
            winner === "player" ? "GAME OVER - YOU WIN!" : "GAME OVER - CPU WINS!",
        );
    }

    const isFirstDraw =
        !newState.playerCard &&
        !newState.cpuCard &&
        newState.playerDeck.length === 26 &&
        newState.cpuDeck.length === 26;

    if (!isFirstDraw && newState.cpuHasNuke && newState.playerDeck.length >= 10 && Math.random() < 0.1) {
        const nukeState = handleNuke(newState, "cpu");
        nukeState.isNukeActive = true;
        return nukeState;
    }

    newState.playerCard = newState.playerDeck.shift() ?? null;
    const playerRank = newState.playerCard?.rank ?? 0;

    if (isFirstDraw) {
        drawCpuCardAvoidingRank(newState, playerRank);
    } else {
        newState.cpuCard = newState.cpuDeck.shift() ?? null;
    }

    if (!newState.playerCard || !newState.cpuCard) {
        const winner = newState.playerCard ? "player" : "cpu";
        return declareWinner(
            newState,
            winner,
            winner === "player" ? "GAME OVER - YOU WIN!" : "GAME OVER - CPU WINS!",
        );
    }

    let cpuRank = newState.cpuCard.rank;

    const gameRunningTime = Date.now() - (newState.gameStartTime || Date.now());
    const isLongGame = gameRunningTime > 120000;

    if (isLongGame) {
        const playerIsWinning = newState.playerDeck.length > newState.cpuDeck.length;
        const leaderDeckSize = Math.max(newState.playerDeck.length, newState.cpuDeck.length);
        const followerDeckSize = Math.min(newState.playerDeck.length, newState.cpuDeck.length);

        const advantage = (leaderDeckSize - followerDeckSize) / 52;
        const favorChance = Math.min(0.5, 0.3 + advantage);

        if (Math.random() < favorChance) {
            const playerWinsNaturally = playerRank > cpuRank;
            if (playerIsWinning !== playerWinsNaturally) {
                const temp = newState.playerCard;
                newState.playerCard = newState.cpuCard;
                newState.cpuCard = temp;
                cpuRank = newState.cpuCard.rank;
            }
        }
    }

    const playerRankNow = newState.playerCard.rank;
    const cpuRankNow = newState.cpuCard.rank;

    // Keep revealed cards in playerCard/cpuCard only. They move to a deck in settleTrick.
    if (playerRankNow > cpuRankNow) {
        newState.message = `You wins with ${newState.playerCard.display}${newState.playerCard.suit}`;
        newState.readyForNextCard = true;
        newState.isWar = false;
    } else if (cpuRankNow > playerRankNow) {
        newState.message = `CPU wins with ${newState.cpuCard.display}${newState.cpuCard.suit}`;
        newState.readyForNextCard = true;
        newState.isWar = false;
    } else {
        // 3 face-down + 1 face-up each after the matching pair.
        const canAffordWar = newState.playerDeck.length >= 4 && newState.cpuDeck.length >= 4;

        if (!canAffordWar) {
            const playerOwned = newState.playerDeck.length + 1;
            const cpuOwned = newState.cpuDeck.length + 1;

            if (playerOwned > cpuOwned) {
                newState.message = "You win! Not enough cards for WAR.";
                newState.playerDeck.push(newState.playerCard, newState.cpuCard);
            } else if (cpuOwned > playerOwned) {
                newState.message = "CPU wins! Not enough cards for WAR.";
                newState.cpuDeck.push(newState.playerCard, newState.cpuCard);
            } else {
                newState.message = "It's a tie! Neither player has enough cards for WAR.";
                newState.playerDeck.push(newState.playerCard);
                newState.cpuDeck.push(newState.cpuCard);
            }

            newState.playerCard = null;
            newState.cpuCard = null;
            newState.readyForNextCard = true;
            newState.isWar = false;
            applyGameOverIfEmpty(newState);
            logCountIfBroken(newState, "drawCards:skipWar");
            return newState;
        }

        newState.message = `WAR! ${newState.playerCard.display}${newState.playerCard.suit} vs ${newState.cpuCard.display}${newState.cpuCard.suit}`;
        newState.isWar = true;
        newState.readyForNextCard = false;
        // Keep the matching cards in play so the table can show them first.
    }

    logCountIfBroken(newState, "drawCards");
    return newState;
}

export function handleNuke(state: LocalState, initiator: "player" | "cpu"): LocalState {
    const newState = cloneState(state);

    if (newState.playerCard) {
        newState.playerDeck.push(newState.playerCard);
        newState.playerCard = null;
    }
    if (newState.cpuCard) {
        newState.cpuDeck.push(newState.cpuCard);
        newState.cpuCard = null;
    }

    if (newState.warPile.length > 0) {
        if (initiator === "cpu") {
            newState.cpuDeck.push(...newState.warPile);
        } else {
            newState.playerDeck.push(...newState.warPile);
        }
        newState.warPile = [];
    }

    newState.isWar = false;
    newState.isWarBeingHandled = false;
    newState.isNukeActive = true;
    newState.readyForNextCard = false;

    if (initiator === "cpu" && newState.cpuHasNuke) {
        if (newState.playerDeck.length < 10) {
            newState.cpuHasNuke = false;
            newState.message =
                "CPU LAUNCHED A NUKE! Player has fewer than 10 cards - Game will end after animation";
            logCountIfBroken(newState, "handleNuke:cpuLow");
            return newState;
        }

        const stolenCards = newState.playerDeck.splice(-10, 10);
        newState.cpuDeck.push(...stolenCards);
        newState.cpuHasNuke = false;
        newState.message = "CPU LAUNCHED A NUKE! You lost 10 cards";
    } else if (initiator === "player" && newState.playerHasNuke) {
        if (newState.cpuDeck.length < 10) {
            newState.playerHasNuke = false;
            newState.message =
                "NUKE LAUNCHED! CPU has fewer than 10 cards - Game will end after animation";
            logCountIfBroken(newState, "handleNuke:playerLow");
            return newState;
        }

        const stolenCards = newState.cpuDeck.splice(-10, 10);
        newState.playerDeck.push(...stolenCards);
        newState.playerHasNuke = false;
        newState.message = "NUKE LAUNCHED! You stole 10 cards!";
    }

    logCountIfBroken(newState, "handleNuke");
    return newState;
}
