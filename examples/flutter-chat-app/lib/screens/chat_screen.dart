/**
 * Flutter Chat Screen Example
 * Demonstrates Provider pattern for state management with Weave
 */

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:weave_flutter/providers/ai_provider.dart';

class ChatScreen extends StatefulWidget {
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _handleSendMessage(AIProvider provider) async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    _inputController.clear();

    // Execute AI chat operation
    await provider.chat(text);

    // Scroll to bottom
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🎯 Weave Chat - Flutter'),
        backgroundColor: Color(0xFF667eea),
        elevation: 0,
      ),
      body: Consumer<AIProvider>(
        builder: (context, aiProvider, child) {
          return Column(
            children: [
              // Chat messages list
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  padding: EdgeInsets.all(16),
                  itemCount: aiProvider.messages.length,
                  itemBuilder: (context, index) {
                    final message = aiProvider.messages[index];
                    final isUser = message['role'] == 'user';

                    return Align(
                      alignment: isUser
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        margin: EdgeInsets.only(bottom: 12),
                        padding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: isUser
                              ? Color(0xFF667eea)
                              : Color(0xFFF0F0F0),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        constraints: BoxConstraints(
                          maxWidth:
                              MediaQuery.of(context).size.width * 0.75,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              message['content'] ?? '',
                              style: TextStyle(
                                color: isUser ? Colors.white : Colors.black87,
                                fontSize: 16,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              _formatTime(message['timestamp']),
                              style: TextStyle(
                                color: isUser
                                    ? Colors.white70
                                    : Colors.grey,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Loading indicator
              if (aiProvider.isLoading)
                Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      CircularProgressIndicator(
                        color: Color(0xFF667eea),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'AI is thinking...',
                        style: TextStyle(color: Color(0xFF667eea)),
                      ),
                    ],
                  ),
                ),

              // Error message
              if (aiProvider.error != null)
                Container(
                  margin: EdgeInsets.all(16),
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Color(0xFFfee),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Error: ${aiProvider.error}',
                    style: TextStyle(color: Color(0xFFc33)),
                  ),
                ),

              // Input area
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: Colors.grey[300]!),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _inputController,
                        decoration: InputDecoration(
                          hintText: 'Type a message...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(4),
                          ),
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        maxLines: null,
                        enabled: !aiProvider.isLoading,
                      ),
                    ),
                    SizedBox(width: 8),
                    FloatingActionButton(
                      onPressed: aiProvider.isLoading ||
                              _inputController.text.trim().isEmpty
                          ? null
                          : () => _handleSendMessage(aiProvider),
                      backgroundColor:
                          aiProvider.isLoading ||
                                  _inputController.text.trim().isEmpty
                              ? Colors.grey
                              : Color(0xFF667eea),
                      child: Icon(Icons.send),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _formatTime(dynamic timestamp) {
    if (timestamp == null) return '';
    if (timestamp is String) {
      return DateTime.parse(timestamp)
          .toLocal()
          .toString()
          .split(' ')[1]
          .substring(0, 5);
    }
    return '';
  }
}
