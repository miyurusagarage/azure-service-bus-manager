# Azure Service Bus Manager

A modern desktop application for managing Azure Service Bus namespaces, built with Electron and React.

![Azure Service Bus Manager](resources/screenshots/topic-viewer-screenshot.png)

## Features

- 🔐 Connect to Azure Service Bus using connection strings
- 📊 View queues and topics in an intuitive tree view
- 🔍 Peek or receive messages in queues and subscriptions
- 📬 Manage topic subscriptions with advanced filtering
- ✉️ Send messages with custom properties and filters
- 🗑️ Delete messages from queues and subscriptions
- ↩️ Resend messages from dead-letter queues
- 🔄 Auto-refresh and manual refresh options
- 🎯 Quick connection testing with timeout handling
- 💫 Modern UI built with React and Ant Design
- 🌐 Cross-platform support (Windows, macOS, Linux)

### Queue Management

- Create queues with advanced configuration options
- View active and dead-letter messages
- Send messages with JSON or plain text content
- Delete messages from queues
- Resend dead-lettered messages

### Topic Management

- Create topics with custom settings
- Create subscriptions with SQL or correlation filters
- View messages in subscriptions
- Send messages with application properties for filtering
- Manage dead-letter queues for subscriptions

### Message Operations

- View message details including:
  - Message body (JSON/Text/XML)
  - System properties
  - Custom application properties
  - Message metadata (ID, correlation ID, etc.)
- Send messages with:
  - Custom content types (JSON/Text/XML)
  - Application properties for filtering
  - Message properties (correlation ID, session ID, etc.)
- Peek or receive messages in queues and subscriptions
- Copy message content for debugging

## Installation

Currently, the application is in development. To run it locally:

1. Install dependencies:

```bash
# Install root level dependencies
npm install

# Install webapp dependencies
cd webapp
npm install

# Install electron dependencies
cd ../electron
npm install
```

This will be combined into one command

3. Start the development application:

```bash
# In the root directory. This will run both frontend and the electron app
npm run dev
```

## Development

The project is structured into two main parts:

- `webapp/`: React frontend built with Vite, TypeScript, and Ant Design
- `electron/`: Electron main process with Azure Service Bus integration

### Tech Stack

- Electron
- React
- TypeScript
- Ant Design
- Tailwind CSS
- Azure Service Bus SDK
- Vite

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add appropriate comments and documentation
- Update the README if needed
- Add tests for new features (when testing is set up)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Azure Service Bus SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/servicebus/service-bus)
- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
- [Tailwind CSS](https://tailwindcss.com/)

## Support

If you encounter any problems or have suggestions, please [open an issue](https://github.com/miyurusagarage/azure-service-bus-manager/issues).
