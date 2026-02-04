"use client"

import MessagesComponent from "../../components/Messages/MessagesComponent"

const Messages = () => {
  const config = {
    showSidebarOffset: false,
    supportAttachments: false,
    showSearchIcon: true,
    hasRecipientDropdown: false,
  }

  return <MessagesComponent config={config} />
}

export default Messages
