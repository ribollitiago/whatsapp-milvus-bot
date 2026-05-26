const userSessions = new Map();

function getSession(userId) {
    if (!userSessions.has(userId)) {
        userSessions.set(userId, {
            step: 'initial',
            data: {}
        });
    }
    return userSessions.get(userId);
}

function updateSession(userId, updates) {
    const session = getSession(userId);
    Object.assign(session, updates);
    userSessions.set(userId, session);
    return session;
}

function resetSession(userId) {
    userSessions.set(userId, {
        step: 'initial',
        data: {}
    });
}

function deleteSession(userId) {
    userSessions.delete(userId);
}

export {
    getSession,
    updateSession,
    resetSession,
    deleteSession
};