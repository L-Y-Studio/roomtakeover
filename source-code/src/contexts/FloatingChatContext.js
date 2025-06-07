import React, { createContext, useContext, useState } from 'react';

const FloatingChatContext = createContext();

export const FloatingChatProvider = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const openFloatingChat = (conversationId) => {
    setActiveConversationId(conversationId);
    setIsDrawerOpen(true);
  };

  const closeFloatingChat = () => {
    setIsDrawerOpen(false);
  };

  return (
    <FloatingChatContext.Provider
      value={{
        isDrawerOpen,
        activeConversationId,
        openFloatingChat,
        closeFloatingChat,
      }}
    >
      {children}
    </FloatingChatContext.Provider>
  );
};

export const useFloatingChat = () => {
  const context = useContext(FloatingChatContext);
  if (!context) {
    throw new Error('useFloatingChat must be used within a FloatingChatProvider');
  }
  return context;
}; 