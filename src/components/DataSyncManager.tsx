import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Database, 
  Users, 
  History, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Share2,
  Copy
} from 'lucide-react';
import { hybridSyncService } from '@/services/hybridSync';
import { universalStorage } from '@/utils/universalStorage';
import { toast } from 'sonner';

interface DataSyncManagerProps {
  isAdmin?: boolean;
}

const DataSyncManager: React.FC<DataSyncManagerProps> = ({ isAdmin = false }) => {
  const [syncStatus, setSyncStatus] = useState(hybridSyncService.getStatus());
  const [dataSummary, setDataSummary] = useState({
    totalUsers: 0,
    totalBets: 0,
    totalHistory: 0,
    lastUpdate: 0
  });
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Update status every 30 seconds
    const interval = setInterval(() => {
      setSyncStatus(hybridSyncService.getStatus());
      // Update data summary from universal storage
      const data = universalStorage.getData();
      setDataSummary({
        totalUsers: data.users?.length || 0,
        totalBets: (data.gameState?.teamAQueue?.length || 0) + (data.gameState?.teamBQueue?.length || 0),
        totalHistory: data.betHistory?.length || 0,
        lastUpdate: Date.now()
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleExportData = () => {
    try {
      const data = hybridSyncService.exportData();
      setExportData(data);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImportData = async () => {
    if (!importData.trim()) {
      toast.error('Please paste data to import');
      return;
    }

    setIsLoading(true);
    try {
      const success = hybridSyncService.importData(importData);
      if (success) {
        toast.success('Data imported successfully');
        setImportData('');
        // Update data summary
        const data = universalStorage.getData();
        setDataSummary({
          totalUsers: data.users?.length || 0,
          totalBets: (data.gameState?.teamAQueue?.length || 0) + (data.gameState?.teamBQueue?.length || 0),
          totalHistory: data.betHistory?.length || 0,
          lastUpdate: Date.now()
        });
      } else {
        toast.error('Failed to import data - invalid format');
      }
    } catch (error) {
      toast.error('Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSync = async () => {
    setIsLoading(true);
    try {
      const success = await hybridSyncService.forceSync();
      if (success) {
        toast.success('Data synchronized successfully');
        setSyncStatus(hybridSyncService.getStatus());
      } else {
        toast.error('Failed to synchronize data');
      }
    } catch (error) {
      toast.error('Failed to synchronize data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      hybridSyncService.clearAllData();
      toast.success('All data cleared');
      const data = universalStorage.getData();
      setDataSummary({
        totalUsers: data.users?.length || 0,
        totalBets: (data.gameState?.teamAQueue?.length || 0) + (data.gameState?.teamBQueue?.length || 0),
        totalHistory: data.betHistory?.length || 0,
        lastUpdate: Date.now()
      });
    }
  };

  const handleShareUrl = async () => {
    try {
      // Use mobile sync service for URL sharing
      const { mobileSyncService } = await import('@/services/mobileSync');
      const success = await mobileSyncService.copyShareableUrl();
      if (success) {
        toast.success('Shareable URL copied to clipboard!');
      } else {
        toast.error('Failed to copy URL to clipboard');
      }
    } catch (error) {
      toast.error('Failed to copy URL to clipboard');
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Universal Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={syncStatus.isEnabled ? "default" : "secondary"}>
              {syncStatus.isEnabled ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {syncStatus.isEnabled ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-sm text-muted-foreground">Sync Status</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Last Sync: </span>
            <span className="font-medium">{formatLastSync(syncStatus.lastSyncTime)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Interval: </span>
            <span className="font-medium">{syncStatus.syncInterval / 1000}s</span>
          </div>
        </div>

        <Separator />

        {/* Data Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{dataSummary.totalUsers}</div>
            <div className="text-sm text-muted-foreground">Users</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <Database className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{dataSummary.totalBets}</div>
            <div className="text-sm text-muted-foreground">Active Bets</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <History className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{dataSummary.totalHistory}</div>
            <div className="text-sm text-muted-foreground">History Records</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{formatLastSync(dataSummary.lastUpdate)}</div>
            <div className="text-sm text-muted-foreground">Last Update</div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Data */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Export Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all app data as a JSON file for backup
              </p>
            </div>
            <Button onClick={handleExportData} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
            {exportData && (
              <div className="space-y-2">
                <Label>Exported Data:</Label>
                <Textarea
                  value={exportData}
                  readOnly
                  className="min-h-[100px] font-mono text-xs"
                  placeholder="Exported data will appear here..."
                />
              </div>
            )}
          </div>

          {/* Import Data */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Import Data</Label>
              <p className="text-sm text-muted-foreground">
                Restore data from a previous backup
              </p>
            </div>
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="min-h-[100px] font-mono text-xs"
              placeholder="Paste exported data here..."
            />
            <Button 
              onClick={handleImportData} 
              disabled={isLoading || !importData.trim()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Sync Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleForceSync} 
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Force Sync Now
          </Button>
          <Button 
            onClick={handleShareUrl} 
            disabled={isLoading}
            variant="secondary"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Copy Shareable URL
          </Button>
          <Button 
            onClick={handleClearAllData} 
            variant="destructive"
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </div>

        {/* Info */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Universal Data Sync</h4>
          <p className="text-sm text-muted-foreground">
            This system ensures your data is synchronized across all browsers and devices. 
            Data is automatically saved and can be exported for backup or imported to restore.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSyncManager;
