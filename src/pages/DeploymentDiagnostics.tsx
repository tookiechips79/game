import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DeploymentDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {};

    // 1. Check current environment
    results.environment = {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      href: window.location.href,
      nodeEnv: process.env.NODE_ENV,
    };

    // 2. Test backend connectivity
    try {
      const response = await fetch('/api/users', { method: 'GET' });
      results.backendAPI = {
        status: response.status,
        ok: response.ok,
        url: '/api/users'
      };
    } catch (error) {
      results.backendAPI = {
        error: String(error),
        url: '/api/users'
      };
    }

    // 3. Test Socket.IO connection
    try {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      let socketUrl = `${protocol}//${window.location.hostname}`;
      if (window.location.hostname === 'localhost') {
        socketUrl = `http://localhost:3001`;
      }
      
      const response = await fetch(`${socketUrl}/socket.io/?EIO=4&transport=polling`, {
        method: 'GET'
      });
      results.socketIO = {
        status: response.status,
        ok: response.ok,
        url: socketUrl
      };
    } catch (error) {
      results.socketIO = {
        error: String(error)
      };
    }

    // 4. Check localStorage
    results.localStorage = {
      usersKey: localStorage.getItem('betting_app_users') ? 'EXISTS' : 'MISSING',
      currentUserKey: localStorage.getItem('betting_app_current_user') ? 'EXISTS' : 'MISSING',
      betHistoryKey: localStorage.getItem('betting_app_bet_history') ? 'EXISTS' : 'MISSING',
    };

    // 5. Check if dist is served
    results.frontendServing = {
      isDistServed: document.title !== '' ? 'YES' : 'NO',
      documentTitle: document.title
    };

    setDiagnostics(results);
    setLoading(false);
    console.log('Diagnostics:', results);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-2 text-[#95deff]">🔧 Deployment Diagnostics</h1>
      <p className="text-gray-400 mb-8">Check if your deployment is configured correctly</p>

      <Button
        onClick={runDiagnostics}
        disabled={loading}
        className="mb-8 bg-gradient-to-r from-[#fa1593] to-[#fa1593]/80"
      >
        {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environment */}
        <Card className="border-2 border-[#95deff] bg-gray-900">
          <CardHeader>
            <CardTitle className="text-[#95deff]">🌍 Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Hostname:</span>
                <span className="text-[#fa1593]">{diagnostics.environment?.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span>Protocol:</span>
                <span className="text-[#fa1593]">{diagnostics.environment?.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span>Port:</span>
                <span className="text-[#fa1593]">{diagnostics.environment?.port || '(default)'}</span>
              </div>
              <div className="flex justify-between">
                <span>NODE_ENV:</span>
                <span className="text-[#fa1593]">{diagnostics.environment?.nodeEnv}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backend API */}
        <Card className={`border-2 ${diagnostics.backendAPI?.ok ? 'border-green-500' : 'border-red-500'} bg-gray-900`}>
          <CardHeader>
            <CardTitle className={diagnostics.backendAPI?.ok ? 'text-green-400' : 'text-red-400'}>
              🔌 Backend API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={diagnostics.backendAPI?.ok ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {diagnostics.backendAPI?.status || 'ERROR'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>URL:</span>
                <span className="text-gray-400 text-xs">{diagnostics.backendAPI?.url}</span>
              </div>
              {diagnostics.backendAPI?.error && (
                <div className="text-red-400 text-xs mt-2">
                  Error: {diagnostics.backendAPI.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Socket.IO */}
        <Card className={`border-2 ${diagnostics.socketIO?.ok ? 'border-green-500' : 'border-red-500'} bg-gray-900`}>
          <CardHeader>
            <CardTitle className={diagnostics.socketIO?.ok ? 'text-green-400' : 'text-red-400'}>
              🔌 Socket.IO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={diagnostics.socketIO?.ok ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {diagnostics.socketIO?.status || 'ERROR'}
                </span>
              </div>
              {diagnostics.socketIO?.error && (
                <div className="text-red-400 text-xs mt-2">
                  Error: {diagnostics.socketIO.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LocalStorage */}
        <Card className="border-2 border-[#95deff] bg-gray-900">
          <CardHeader>
            <CardTitle className="text-[#95deff]">💾 LocalStorage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Users:</span>
                <span className="text-[#fa1593]">{diagnostics.localStorage?.usersKey}</span>
              </div>
              <div className="flex justify-between">
                <span>Current User:</span>
                <span className="text-[#fa1593]">{diagnostics.localStorage?.currentUserKey}</span>
              </div>
              <div className="flex justify-between">
                <span>Bet History:</span>
                <span className="text-[#fa1593]">{diagnostics.localStorage?.betHistoryKey}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frontend */}
        <Card className={`border-2 ${diagnostics.frontendServing?.isDistServed === 'YES' ? 'border-green-500' : 'border-red-500'} bg-gray-900`}>
          <CardHeader>
            <CardTitle className={diagnostics.frontendServing?.isDistServed === 'YES' ? 'text-green-400' : 'text-red-400'}>
              📄 Frontend Serving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Dist Served:</span>
                <span className={diagnostics.frontendServing?.isDistServed === 'YES' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {diagnostics.frontendServing?.isDistServed}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Title: {diagnostics.frontendServing?.documentTitle}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw JSON */}
      <Card className="border-2 border-[#95deff] bg-gray-900 mt-6">
        <CardHeader>
          <CardTitle className="text-[#95deff]">📋 Raw Diagnostics JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-black p-4 rounded text-xs text-gray-300 overflow-auto max-h-64">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentDiagnostics;

