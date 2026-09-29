'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { airportApi, errorMessage } from '@/lib/api';
import type { CreateAirportRequest, UpdateAirportRequest } from '@/types';
import { Plus, Edit, Trash2, Loader2, Save, X, Upload, Download, Search, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AirportsPage() {
  const [airports, setAirports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAirport, setEditingAirport] = useState<any>(null);
  const [formData, setFormData] = useState<CreateAirportRequest>({
    iata_code: '',
    name: '',
    city: '',
    country: '',
    address: '',
    terminal: '',
    lat: undefined,
    lng: undefined,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateAirportRequest>>({});
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    try {
      const response = await airportApi.list({ active_only: false });
      setAirports(response.data || []);
    } catch (error) {
      console.error('Failed to fetch airports:', error);
      addToast({ type: 'error', title: 'Failed to load airports' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (airport?: any) => {
    if (airport) {
      setEditingAirport(airport);
      setFormData({
        iata_code: airport.iata_code,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        address: airport.address,
        terminal: airport.terminal || '',
        lat: airport.lat,
        lng: airport.lng,
        is_active: airport.is_active,
      });
    } else {
      setEditingAirport(null);
      setFormData({
        iata_code: '',
        name: '',
        city: '',
        country: '',
        address: '',
        terminal: '',
        lat: undefined,
        lng: undefined,
        is_active: true,
      });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<CreateAirportRequest> = {};
    
    if (!formData.iata_code) errors.iata_code = 'IATA code is required';
    else if (formData.iata_code.length !== 3) errors.iata_code = 'IATA code must be 3 characters';
    
    if (!formData.name) errors.name = 'Airport name is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.country) errors.country = 'Country is required';
    if (!formData.address) errors.address = 'Address is required';

    // Check for duplicate (only on create)
    if (!editingAirport) {
      const duplicate = airports.find(a => a.iata_code === formData.iata_code.toUpperCase());
      if (duplicate) errors.iata_code = 'Airport with this IATA code already exists';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = { ...formData, iata_code: formData.iata_code.toUpperCase() };

    try {
      if (editingAirport) {
        await airportApi.update(editingAirport.iata_code, submitData);
        addToast({ type: 'success', title: 'Airport updated' });
      } else {
        await airportApi.create(submitData);
        addToast({ type: 'success', title: 'Airport created' });
      }
      fetchAirports();
      setModalOpen(false);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      addToast({ type: 'error', title: axiosError.response?.data?.detail || 'Failed to save' });
    }
  };

  const handleDelete = async (airport: any) => {
    if (!window.confirm(`Deactivate airport ${airport.iata_code}?`)) return;
    
    try {
      await airportApi.delete(airport.iata_code);
      addToast({ type: 'success', title: 'Airport deactivated' });
      fetchAirports();
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to deactivate airport' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUpload(file);
    try {
      const response = await airportApi.bulkUpload(file);
      addToast({ 
        type: 'success', 
        title: `Upload complete: ${response.data.created} created, ${response.data.skipped} skipped` 
      });
      fetchAirports();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      addToast({ type: 'error', title: axiosError.response?.data?.detail || 'Upload failed' });
    } finally {
      setFileUpload(null);
      e.target.value = '';
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'iata_code',
      header: 'IATA',
      render: (row) => (
        <span className="font-mono font-bold text-lg">{row.iata_code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-secondary-500">{row.address}</p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
    },
    {
      key: 'country',
      header: 'Country',
    },
    {
      key: 'terminal',
      header: 'Terminal',
      render: (row) => row.terminal || '-',
    },
    {
      key: 'coordinates',
      header: 'Coordinates',
      render: (row) => {
        if (row.lat && row.lng) {
          return (
            <span className="font-mono text-sm">
              {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
            </span>
          );
        }
        return '-';
      },
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(row)} className="p-1.5" aria-label="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="p-1.5 text-red-600" aria-label="Deactivate">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Airports</h1>
          <p className="text-secondary-500">Manage airport master data for transport bookings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Airport
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
            </div>
          ) : (
            <Table
              columns={columns}
              data={airports}
              keyExtractor={(row) => row.iata_code}
              isLoading={isLoading}
              hoverable
              striped
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAirport ? 'Edit Airport' : 'Add Airport'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="IATA Code"
              value={formData.iata_code}
              onChange={(e) => setFormData({ ...formData, iata_code: e.target.value.toUpperCase() })}
              placeholder="BOM"
              maxLength={3}
              disabled={!!editingAirport}
              error={formErrors.iata_code}
              required
            />
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Chhatrapati Shivaji Maharaj International Airport"
              error={formErrors.name}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Mumbai"
              error={formErrors.city}
              required
            />
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="India"
              error={formErrors.country}
              required
            />
            <Input
              label="Terminal"
              value={formData.terminal}
              onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
              placeholder="T2"
            />
          </div>

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Andheri East, Mumbai, Maharashtra 400099"
            error={formErrors.address}
            required
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={formData.lat || ''}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="19.0896"
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={formData.lng || ''}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="72.8656"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-secondary-700">
                Active
              </label>
            </div>
          </div>

          <CardFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {editingAirport ? 'Update' : 'Create'}
            </Button>
          </CardFooter>
        </form>
      </Modal>
    </div>
  );
}