# DocMind – RAG-Based Document Q&A

DocMind is an AI-powered document question-answering application built using Retrieval-Augmented Generation (RAG). It allows users to upload documents and ask questions based on their content.

## Features

- Document upload and processing
- AI-powered question answering using RAG
- Semantic document search using vector embeddings
- PostgreSQL with pgvector for vector storage
- Conversation and chat-memory support
- User authentication and document-level access control
- Source citations with document and page information
- Streaming responses for conversational interaction
- Configurable RAG retrieval parameters

## Tech Stack

### Backend
- Java
- Spring Boot
- Spring AI
- Spring Data JPA
- Spring Security
- JWT

### AI / RAG
- OpenAI
- Retrieval-Augmented Generation (RAG)
- Vector embeddings
- pgvector

### Database
- PostgreSQL

### Frontend
- React

### Build & Tools
- Maven
- Git
- GitHub

## RAG Pipeline

Document Upload
       ↓
Document Processing
       ↓
Text Chunking
       ↓
Vector Embeddings
       ↓
PostgreSQL + pgvector
       ↓
User Question
       ↓
Similarity Search
       ↓
Relevant Document Chunks
       ↓
LLM + Retrieved Context
       ↓
Generated Answer + Citations

## RAG Configuration

The application supports configurable retrieval parameters such as:

- Chunk size
- Number of retrieved chunks (top-k)
- Similarity threshold

The retrieval layer also limits the maximum number of retrieved chunks to avoid unnecessarily large LLM contexts.

## Project Structure

docmind-rag-based-project/
├── src/
│   ├── main/
│   │   ├── java/
│   │   └── resources/
│   └── test/
├── pom.xml
└── README.md

## Getting Started

### Prerequisites

- Java 21
- Maven
- PostgreSQL
- pgvector
- OpenAI API key

### Configuration

Configure the required environment variables before running the application:

DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
OPENAI_API_KEY
JWT_SECRET

### Run

./mvnw spring-boot:run

The backend runs on port 8081 by default.

## Author

Nikhil

GitHub: https://github.com/NikhilNexus790
