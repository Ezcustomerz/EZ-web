import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  useTheme,
  Button,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Search, FilterList, DateRange, ShoppingBag } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlacedOrderCard } from '../../../components/cards/client/PlacedOrderCard';
import { PaymentApprovalOrderCard } from '../../../components/cards/client/PaymentApprovalOrderCard';
import { InProgressOrderCard } from '../../../components/cards/client/InProgressOrderCard';
import { LockedOrderCard } from '../../../components/cards/client/LockedOrderCard';
import { DownloadOrderCard } from '../../../components/cards/client/DownloadOrderCard';
import { CompletedOrderCard } from '../../../components/cards/client/CompletedOrderCard';
import { CanceledOrderCard } from '../../../components/cards/client/CanceledOrderCard';

// Dummy data for connected creatives
const dummyConnectedCreatives = [
  { id: '1', name: 'DJ Producer' },
  { id: '2', name: 'Beat Master' },
  { id: '3', name: 'Vocal Coach Pro' },
  { id: '4', name: 'Sound Designer X' },
  { id: '5', name: 'Engineer Elite' },
];

// Dummy order data
const dummyOrders = [
  {
    id: '1',
    serviceName: 'Mix & Master',
    creativeName: 'DJ Producer',
    orderDate: '2025-10-03',
    status: 'placed',
    calendarDate: '2025-10-10T14:30:00',
    description: 'Awaiting Approval',
    price: 150.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_1',
    serviceDescription: 'Professional mixing and mastering service for your tracks',
    serviceDeliveryTime: '5-7 days',
    serviceColor: '#667eea',
    creativeId: 'creative_1',
    creativeDisplayName: 'DJ Producer',
    creativeTitle: 'Audio Engineer & Producer',
    creativeEmail: 'djproducer@ez.com',
    creativeRating: 4.9,
    creativeReviewCount: 24,
    creativeServicesCount: 12,
    creativeColor: '#667eea',
  },
  {
    id: '2',
    serviceName: 'Podcast Editing',
    creativeName: 'Sound Designer X',
    orderDate: '2025-10-03',
    status: 'payment-approval',
    calendarDate: '2025-10-12T10:00:00',
    description: 'Payment Action Required',
    price: 180.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'payment_upfront' as const,
    serviceId: 'svc_2',
    serviceDescription: 'Complete podcast editing including noise reduction and mastering',
    serviceDeliveryTime: '3-5 days',
    serviceColor: '#4ecdc4',
    creativeId: 'creative_4',
    creativeDisplayName: 'Sound Designer X',
    creativeTitle: 'Audio Engineer & Sound Designer',
    creativeEmail: 'sounddesigner@ez.com',
    creativeRating: 4.8,
    creativeReviewCount: 16,
    creativeServicesCount: 11,
    creativeColor: '#4ecdc4',
  },
  {
    id: '3',
    serviceName: 'Vocal Recording Session',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-10-02',
    status: 'in-progress',
    calendarDate: null,
    description: 'Creative is working on your service',
    price: 200.00,
    approvedDate: '2025-10-03',
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'payment_upfront' as const,
    amountPaid: 200.00,
    amountRemaining: 0.00,
    serviceId: 'svc_3',
    serviceDescription: 'Professional vocal recording session with guidance',
    serviceDeliveryTime: '1-2 days',
    serviceColor: '#96ceb4',
    creativeId: 'creative_3',
    creativeDisplayName: 'Vocal Coach Pro',
    creativeTitle: 'Vocal Coach & Recording Specialist',
    creativeEmail: 'vocalcoach@ez.com',
    creativeRating: 5.0,
    creativeReviewCount: 31,
    creativeServicesCount: 7,
    creativeColor: '#96ceb4',
  },
  {
    id: '4',
    serviceName: 'Beat Production',
    creativeName: 'Beat Master',
    orderDate: '2025-10-01',
    status: 'placed',
    calendarDate: null,
    description: 'Awaiting Approval',
    price: 250.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'payment_later' as const,
    serviceId: 'svc_4',
    serviceDescription: 'Custom beat production tailored to your style',
    serviceDeliveryTime: '7-10 days',
    serviceColor: '#feca57',
    creativeId: 'creative_2',
    creativeDisplayName: 'Beat Master',
    creativeTitle: 'Hip-Hop Producer & Beatmaker',
    creativeEmail: 'beatmaster@ez.com',
    creativeRating: 4.7,
    creativeReviewCount: 18,
    creativeServicesCount: 9,
    creativeColor: '#feca57',
  },
  {
    id: '5',
    serviceName: 'Mastering Service',
    creativeName: 'Engineer Elite',
    orderDate: '2025-09-30',
    status: 'payment-approval',
    calendarDate: null,
    description: 'Payment Action Required',
    price: 120.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'split_payment' as const,
    depositAmount: 60.00,
    remainingAmount: 60.00,
    serviceId: 'svc_5',
    serviceDescription: 'High-quality mastering for final polish',
    serviceDeliveryTime: '2-3 days',
    serviceColor: '#ff6b6b',
    creativeId: 'creative_5',
    creativeDisplayName: 'Engineer Elite',
    creativeTitle: 'Mastering Engineer',
    creativeEmail: 'engineer@ez.com',
    creativeRating: 4.9,
    creativeReviewCount: 28,
    creativeServicesCount: 6,
    creativeColor: '#ff6b6b',
  },
  {
    id: '6',
    serviceName: 'Sound Design Package',
    creativeName: 'Sound Designer X',
    orderDate: '2025-09-30',
    status: 'in-progress',
    calendarDate: '2025-10-20T15:00:00',
    description: 'Creative is actively working on this',
    price: 300.00,
    approvedDate: '2025-10-01',
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'split_payment' as const,
    amountPaid: 150.00,
    amountRemaining: 150.00,
    serviceId: 'svc_6',
    serviceDescription: 'Complete sound design package for your project',
    serviceDeliveryTime: '10-14 days',
    serviceColor: '#a55eea',
    creativeId: 'creative_4',
    creativeDisplayName: 'Sound Designer X',
    creativeTitle: 'Audio Engineer & Sound Designer',
    creativeEmail: 'sounddesigner@ez.com',
    creativeRating: 4.8,
    creativeReviewCount: 16,
    creativeServicesCount: 11,
    creativeColor: '#a55eea',
  },
  {
    id: '7',
    serviceName: 'Audio Engineering',
    creativeName: 'Engineer Elite',
    orderDate: '2025-09-28',
    status: 'placed',
    calendarDate: null,
    description: 'Awaiting Approval',
    price: 175.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_7',
    serviceDescription: 'Professional audio engineering services',
    serviceDeliveryTime: '5-7 days',
    serviceColor: '#6c5ce7',
  },
  {
    id: '18',
    serviceName: 'Free Consultation',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-10-02',
    status: 'placed',
    calendarDate: '2025-10-08T14:00:00',
    description: 'Awaiting Approval',
    price: 0.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'free' as const,
    serviceId: 'svc_18',
    serviceDescription: 'Complimentary 30-minute consultation to discuss your music goals and how I can help you achieve them',
    serviceDeliveryTime: '30 minutes',
    serviceColor: '#95a5a6',
    creativeId: 'creative_3',
    creativeDisplayName: 'Vocal Coach Pro',
    creativeTitle: 'Vocal Coach & Recording Specialist',
    creativeEmail: 'vocalcoach@ez.com',
    creativeRating: 5.0,
    creativeReviewCount: 31,
    creativeServicesCount: 7,
    creativeColor: '#95a5a6',
  },
  {
    id: '19',
    serviceName: 'Portfolio Review Session',
    creativeName: 'Beat Master',
    orderDate: '2025-09-29',
    status: 'in-progress',
    calendarDate: '2025-10-05T10:00:00',
    description: 'Session in progress',
    price: 0.00,
    approvedDate: '2025-09-30',
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'free' as const,
    amountPaid: 0.00,
    amountRemaining: 0.00,
    serviceId: 'svc_19',
    serviceDescription: 'Free portfolio review and feedback session to help improve your music production',
    serviceDeliveryTime: '1 hour',
    serviceColor: '#7f8c8d',
    creativeId: 'creative_2',
    creativeDisplayName: 'Beat Master',
    creativeTitle: 'Hip-Hop Producer & Beatmaker',
    creativeEmail: 'beatmaster@ez.com',
    creativeRating: 4.7,
    creativeReviewCount: 18,
    creativeServicesCount: 9,
    creativeColor: '#7f8c8d',
  },
  {
    id: '8',
    serviceName: 'Track Mixing',
    creativeName: 'DJ Producer',
    orderDate: '2025-09-27',
    status: 'in-progress',
    calendarDate: null,
    description: 'Service in progress',
    price: 195.00,
    approvedDate: '2025-09-28',
    completedDate: null,
    fileCount: null,
    fileSize: null,
    paymentOption: 'payment_later' as const,
    amountPaid: 0.00,
    amountRemaining: 195.00,
    serviceId: 'svc_8',
    serviceDescription: 'Professional track mixing service',
    serviceDeliveryTime: '4-6 days',
    serviceColor: '#fd79a8',
    creativeId: 'creative_1',
    creativeDisplayName: 'DJ Producer',
    creativeTitle: 'Audio Engineer & Producer',
    creativeEmail: 'djproducer@ez.com',
    creativeRating: 4.9,
    creativeReviewCount: 24,
    creativeServicesCount: 12,
    creativeColor: '#fd79a8',
  },
  {
    id: '9',
    serviceName: 'Album Mastering',
    creativeName: 'Engineer Elite',
    orderDate: '2025-09-25',
    status: 'locked',
    calendarDate: '2025-10-02T16:00:00',
    description: 'Files locked until payment completed',
    price: 350.00,
    approvedDate: '2025-09-26',
    completedDate: '2025-10-04',
    fileCount: 12,
    fileSize: '2.4 GB',
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_9',
    serviceDescription: 'Complete album mastering service',
    serviceDeliveryTime: '14-21 days',
    serviceColor: '#00b894',
    creativeId: 'creative_5',
    creativeDisplayName: 'Mike "Engineer" Elite',
    creativeTitle: 'Audio Engineer & Mastering Specialist',
    creativeEmail: 'mike@engineerelite.com',
    creativeRating: 5.0,
    creativeReviewCount: 203,
    creativeServicesCount: 15,
    creativeColor: '#00b894',
    creativeAvatarUrl: undefined,
  },
  {
    id: '10',
    serviceName: 'Remix Production',
    creativeName: 'Beat Master',
    orderDate: '2025-09-24',
    status: 'locked',
    calendarDate: null,
    description: 'Payment required to unlock files',
    price: 280.00,
    approvedDate: '2025-09-25',
    completedDate: '2025-10-03',
    fileCount: 5,
    fileSize: '856 MB',
    paymentOption: 'payment_later' as const,
    serviceId: 'svc_10',
    serviceDescription: 'Professional remix production',
    serviceDeliveryTime: '7-10 days',
    serviceColor: '#0984e3',
    creativeId: 'creative_2',
    creativeDisplayName: 'Marcus "Beat" Thompson',
    creativeTitle: 'Drum Programmer & Producer',
    creativeEmail: 'marcus@beatmaster.com',
    creativeRating: 4.8,
    creativeReviewCount: 124,
    creativeServicesCount: 18,
    creativeColor: '#0984e3',
    creativeAvatarUrl: undefined,
  },
  {
    id: '11',
    serviceName: 'Vocal Tuning',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-22',
    status: 'download',
    calendarDate: '2025-09-28T11:00:00',
    description: 'Files ready for download',
    price: 150.00,
    approvedDate: '2025-09-23',
    completedDate: '2025-10-02',
    fileCount: 8,
    fileSize: '1.2 GB',
    paymentOption: 'payment_upfront' as const,
    serviceId: 'svc_11',
    serviceDescription: 'Professional vocal tuning and pitch correction',
    serviceDeliveryTime: '2-4 days',
    serviceColor: '#00cec9',
    files: [
      { id: 'file_1', name: 'Lead_Vocals_Tuned.wav', type: 'Audio (WAV)', size: '256 MB' },
      { id: 'file_2', name: 'Backup_Vocals_Tuned.wav', type: 'Audio (WAV)', size: '198 MB' },
      { id: 'file_3', name: 'Harmony_Track_1.wav', type: 'Audio (WAV)', size: '142 MB' },
      { id: 'file_4', name: 'Harmony_Track_2.wav', type: 'Audio (WAV)', size: '138 MB' },
      { id: 'file_5', name: 'Vocal_Stems.zip', type: 'Archive (ZIP)', size: '425 MB' },
      { id: 'file_6', name: 'Project_Notes.pdf', type: 'Document (PDF)', size: '2.4 MB' },
      { id: 'file_7', name: 'Pitch_Reference.txt', type: 'Text (TXT)', size: '8 KB' },
      { id: 'file_8', name: 'Final_Mix_Preview.mp3', type: 'Audio (MP3)', size: '12 MB' },
    ],
    creativeId: 'creative_3',
    creativeDisplayName: 'Sarah Johnson',
    creativeTitle: 'Vocal Coach & Producer',
    creativeEmail: 'sarah@vocalcoachpro.com',
    creativeRating: 4.9,
    creativeReviewCount: 87,
    creativeServicesCount: 12,
    creativeColor: '#00cec9',
    creativeAvatarUrl: undefined,
  },
  {
    id: '12',
    serviceName: 'Drum Programming',
    creativeName: 'Beat Master',
    orderDate: '2025-09-20',
    status: 'download',
    calendarDate: null,
    description: 'Your files are ready to download',
    price: 220.00,
    approvedDate: '2025-09-21',
    completedDate: '2025-10-01',
    fileCount: 15,
    fileSize: '3.1 GB',
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_12',
    serviceDescription: 'Custom drum programming for your tracks',
    serviceDeliveryTime: '5-7 days',
    serviceColor: '#fdcb6e',
    files: [
      { id: 'file_9', name: 'Kick_Pattern_1.wav', type: 'Audio (WAV)', size: '185 MB' },
      { id: 'file_10', name: 'Kick_Pattern_2.wav', type: 'Audio (WAV)', size: '178 MB' },
      { id: 'file_11', name: 'Snare_Layer_1.wav', type: 'Audio (WAV)', size: '156 MB' },
      { id: 'file_12', name: 'Snare_Layer_2.wav', type: 'Audio (WAV)', size: '164 MB' },
      { id: 'file_13', name: 'Hi_Hat_Groove.wav', type: 'Audio (WAV)', size: '142 MB' },
      { id: 'file_14', name: 'Percussion_Elements.wav', type: 'Audio (WAV)', size: '298 MB' },
      { id: 'file_15', name: 'Full_Drum_Mix.wav', type: 'Audio (WAV)', size: '512 MB' },
      { id: 'file_16', name: 'Drum_Stems_Separated.zip', type: 'Archive (ZIP)', size: '876 MB' },
      { id: 'file_17', name: 'MIDI_Files.zip', type: 'Archive (ZIP)', size: '45 MB' },
      { id: 'file_18', name: 'Drum_Patterns_Reference.pdf', type: 'Document (PDF)', size: '5.2 MB' },
      { id: 'file_19', name: 'BPM_Tempo_Map.txt', type: 'Text (TXT)', size: '12 KB' },
      { id: 'file_20', name: 'Groove_Video_Tutorial.mp4', type: 'Video (MP4)', size: '458 MB' },
      { id: 'file_21', name: 'Sample_Pack_Used.zip', type: 'Archive (ZIP)', size: '328 MB' },
      { id: 'file_22', name: 'Alternate_Mix_Preview.mp3', type: 'Audio (MP3)', size: '18 MB' },
      { id: 'file_23', name: 'Session_Screenshot.png', type: 'Image (PNG)', size: '2.8 MB' },
    ],
    creativeId: 'creative_2',
    creativeDisplayName: 'Marcus "Beat" Thompson',
    creativeTitle: 'Drum Programmer & Producer',
    creativeEmail: 'marcus@beatmaster.com',
    creativeRating: 4.8,
    creativeReviewCount: 124,
    creativeServicesCount: 18,
    creativeColor: '#fdcb6e',
    creativeAvatarUrl: undefined,
  },
  {
    id: '20',
    serviceName: 'Production Tips Session',
    creativeName: 'Sound Designer X',
    orderDate: '2025-09-25',
    status: 'download',
    calendarDate: '2025-09-26T14:00:00',
    description: 'Files ready for download',
    price: 0.00,
    approvedDate: '2025-09-25',
    completedDate: '2025-09-26',
    fileCount: 3,
    fileSize: '45 MB',
    paymentOption: 'free' as const,
    serviceId: 'svc_20',
    serviceDescription: 'Free production tips and tricks session recording',
    serviceDeliveryTime: '1 hour',
    serviceColor: '#6c5ce7',
    files: [
      { id: 'file_24', name: 'Session_Recording.mp4', type: 'Video (MP4)', size: '38 MB' },
      { id: 'file_25', name: 'Production_Tips_PDF.pdf', type: 'Document (PDF)', size: '4.5 MB' },
      { id: 'file_26', name: 'Resource_Links.txt', type: 'Text (TXT)', size: '6 KB' },
    ],
    creativeId: 'creative_4',
    creativeDisplayName: 'Alex Rivera',
    creativeTitle: 'Sound Designer & Educator',
    creativeEmail: 'alex@sounddesignerx.com',
    creativeRating: 4.7,
    creativeReviewCount: 56,
    creativeServicesCount: 9,
    creativeColor: '#6c5ce7',
    creativeAvatarUrl: undefined,
  },
  {
    id: '21',
    serviceName: 'Mastering Service',
    creativeName: 'Sound Designer X',
    orderDate: '2025-08-01',
    status: 'download',
    calendarDate: null,
    description: 'Files ready for download',
    price: 300.00,
    approvedDate: '2025-08-02',
    completedDate: '2025-08-25',
    fileCount: 5,
    fileSize: '680 MB',
    paymentOption: 'payment_upfront' as const,
    serviceId: 'svc_21',
    serviceDescription: 'Professional audio mastering service',
    serviceDeliveryTime: '3-5 days',
    serviceColor: '#e74c3c',
    files: [
      { id: 'file_43', name: 'Track_01_Mastered.wav', type: 'Audio (WAV)', size: '156 MB' },
      { id: 'file_44', name: 'Track_02_Mastered.wav', type: 'Audio (WAV)', size: '148 MB' },
      { id: 'file_45', name: 'Track_03_Mastered.wav', type: 'Audio (WAV)', size: '152 MB' },
      { id: 'file_46', name: 'Full_Album_Master.wav', type: 'Audio (WAV)', size: '214 MB' },
      { id: 'file_47', name: 'Mastering_Report.pdf', type: 'Document (PDF)', size: '10 MB' },
    ],
    creativeId: 'creative_4',
    creativeDisplayName: 'Alex Rivera',
    creativeTitle: 'Sound Designer & Educator',
    creativeEmail: 'alex@sounddesignerx.com',
    creativeRating: 4.7,
    creativeReviewCount: 56,
    creativeServicesCount: 9,
    creativeColor: '#e74c3c',
    creativeAvatarUrl: undefined,
  },
  {
    id: '13',
    serviceName: 'Beat Production',
    creativeName: 'DJ Producer',
    orderDate: '2025-09-15',
    status: 'completed',
    calendarDate: '2025-09-20T15:00:00',
    description: 'Service completed successfully',
    price: 180.00,
    approvedDate: '2025-09-16',
    completedDate: '2025-09-28',
    fileCount: 6,
    fileSize: '945 MB',
    paymentOption: 'payment_upfront' as const,
    serviceId: 'svc_13',
    serviceDescription: 'Custom beat production service',
    serviceDeliveryTime: '7-10 days',
    serviceColor: '#e84393',
    files: [
      { id: 'file_27', name: 'Main_Beat_Master.wav', type: 'Audio (WAV)', size: '245 MB' },
      { id: 'file_28', name: 'Beat_Stems.zip', type: 'Archive (ZIP)', size: '512 MB' },
      { id: 'file_29', name: 'MIDI_Project.zip', type: 'Archive (ZIP)', size: '87 MB' },
      { id: 'file_30', name: 'Mix_Notes.pdf', type: 'Document (PDF)', size: '3.2 MB' },
      { id: 'file_31', name: 'Beat_Preview.mp3', type: 'Audio (MP3)', size: '15 MB' },
      { id: 'file_32', name: 'Alternate_Version.wav', type: 'Audio (WAV)', size: '82 MB' },
    ],
    creativeId: 'creative_1',
    creativeDisplayName: 'DJ Producer',
    creativeTitle: 'Music Producer & Beat Maker',
    creativeEmail: 'contact@djproducer.com',
    creativeRating: 4.9,
    creativeReviewCount: 156,
    creativeServicesCount: 22,
    creativeColor: '#e84393',
    creativeAvatarUrl: undefined,
  },
  {
    id: '14',
    serviceName: 'Consultation Call',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-12',
    status: 'completed',
    calendarDate: '2025-09-18T10:30:00',
    description: 'Consultation completed',
    price: 0.00,
    approvedDate: '2025-09-13',
    completedDate: '2025-09-18',
    fileCount: null,
    fileSize: null,
    paymentOption: 'free' as const,
    serviceId: 'svc_14',
    serviceDescription: 'Free consultation call to discuss your project',
    serviceDeliveryTime: '30 minutes',
    serviceColor: '#2d3436',
    files: [],
    creativeId: 'creative_3',
    creativeDisplayName: 'Sarah Johnson',
    creativeTitle: 'Vocal Coach & Producer',
    creativeEmail: 'sarah@vocalcoachpro.com',
    creativeRating: 4.9,
    creativeReviewCount: 87,
    creativeServicesCount: 12,
    creativeColor: '#00cec9',
    creativeAvatarUrl: undefined,
  },
  {
    id: '15',
    serviceName: 'Audio Editing',
    creativeName: 'Beat Master',
    orderDate: '2025-09-08',
    status: 'completed',
    calendarDate: null,
    description: 'All edits have been completed',
    price: 250.00,
    approvedDate: '2025-09-09',
    completedDate: '2025-09-25',
    fileCount: 10,
    fileSize: '1.8 GB',
    paymentOption: 'payment_later' as const,
    serviceId: 'svc_15',
    serviceDescription: 'Professional audio editing service',
    serviceDeliveryTime: '5-7 days',
    serviceColor: '#667eea',
    files: [
      { id: 'file_33', name: 'Track_01_Edited.wav', type: 'Audio (WAV)', size: '186 MB' },
      { id: 'file_34', name: 'Track_02_Edited.wav', type: 'Audio (WAV)', size: '192 MB' },
      { id: 'file_35', name: 'Track_03_Edited.wav', type: 'Audio (WAV)', size: '178 MB' },
      { id: 'file_36', name: 'Track_04_Edited.wav', type: 'Audio (WAV)', size: '184 MB' },
      { id: 'file_37', name: 'Full_Mix_Edited.wav', type: 'Audio (WAV)', size: '425 MB' },
      { id: 'file_38', name: 'Editing_Before_After.pdf', type: 'Document (PDF)', size: '8.5 MB' },
      { id: 'file_39', name: 'EQ_Settings.txt', type: 'Text (TXT)', size: '4 KB' },
      { id: 'file_40', name: 'Compression_Chain.txt', type: 'Text (TXT)', size: '3 KB' },
      { id: 'file_41', name: 'Preview_Mix.mp3', type: 'Audio (MP3)', size: '22 MB' },
      { id: 'file_42', name: 'Session_File.zip', type: 'Archive (ZIP)', size: '625 MB' },
    ],
    creativeId: 'creative_2',
    creativeDisplayName: 'Marcus "Beat" Thompson',
    creativeTitle: 'Drum Programmer & Producer',
    creativeEmail: 'marcus@beatmaster.com',
    creativeRating: 4.8,
    creativeReviewCount: 124,
    creativeServicesCount: 18,
    creativeColor: '#fdcb6e',
    creativeAvatarUrl: undefined,
  },
  {
    id: '22',
    serviceName: 'Podcast Editing',
    creativeName: 'DJ Producer',
    orderDate: '2025-07-20',
    status: 'completed',
    calendarDate: null,
    description: 'Service completed successfully',
    price: 175.00,
    approvedDate: '2025-07-21',
    completedDate: '2025-08-15',
    fileCount: 8,
    fileSize: '1.1 GB',
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_22',
    serviceDescription: 'Professional podcast editing and post-production',
    serviceDeliveryTime: '3-5 days',
    serviceColor: '#3498db',
    files: [
      { id: 'file_48', name: 'Episode_01_Final.mp3', type: 'Audio (MP3)', size: '125 MB' },
      { id: 'file_49', name: 'Episode_02_Final.mp3', type: 'Audio (MP3)', size: '132 MB' },
      { id: 'file_50', name: 'Episode_03_Final.mp3', type: 'Audio (MP3)', size: '118 MB' },
      { id: 'file_51', name: 'Episode_04_Final.mp3', type: 'Audio (MP3)', size: '128 MB' },
      { id: 'file_52', name: 'Intro_Outro_Music.wav', type: 'Audio (WAV)', size: '245 MB' },
      { id: 'file_53', name: 'Show_Notes.pdf', type: 'Document (PDF)', size: '5.2 MB' },
      { id: 'file_54', name: 'Timestamps.txt', type: 'Text (TXT)', size: '12 KB' },
      { id: 'file_55', name: 'Raw_Files_Backup.zip', type: 'Archive (ZIP)', size: '425 MB' },
    ],
    creativeId: 'creative_1',
    creativeDisplayName: 'DJ Producer',
    creativeTitle: 'Music Producer & Beat Maker',
    creativeEmail: 'contact@djproducer.com',
    creativeRating: 4.9,
    creativeReviewCount: 156,
    creativeServicesCount: 22,
    creativeColor: '#3498db',
    creativeAvatarUrl: undefined,
  },
  {
    id: '16',
    serviceName: 'Music Video Shoot',
    creativeName: 'Vocal Coach Pro',
    orderDate: '2025-09-05',
    status: 'canceled',
    calendarDate: null,
    description: 'Service was canceled',
    price: 500.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    canceledDate: '2025-09-07',
    paymentOption: 'payment_upfront' as const,
    serviceId: 'svc_16',
    serviceDescription: 'Professional music video production',
    serviceDeliveryTime: '30-45 days',
    serviceColor: '#f093fb',
    creativeId: 'creative_3',
    creativeDisplayName: 'Sarah Johnson',
    creativeTitle: 'Vocal Coach & Producer',
    creativeEmail: 'sarah@vocalcoachpro.com',
    creativeRating: 4.9,
    creativeReviewCount: 87,
    creativeServicesCount: 12,
    creativeColor: '#f093fb',
    creativeAvatarUrl: undefined,
  },
  {
    id: '17',
    serviceName: 'Track Mastering',
    creativeName: 'DJ Producer',
    orderDate: '2025-08-28',
    status: 'canceled',
    calendarDate: '2025-09-05T16:00:00',
    description: 'Booking canceled by client',
    price: 175.00,
    approvedDate: null,
    completedDate: null,
    fileCount: null,
    fileSize: null,
    canceledDate: '2025-08-30',
    paymentOption: 'split_payment' as const,
    serviceId: 'svc_17',
    serviceDescription: 'Professional track mastering service',
    serviceDeliveryTime: '3-5 days',
    serviceColor: '#45b7d1',
    creativeId: 'creative_1',
    creativeDisplayName: 'DJ Producer',
    creativeTitle: 'Music Producer & Beat Maker',
    creativeEmail: 'contact@djproducer.com',
    creativeRating: 4.9,
    creativeReviewCount: 156,
    creativeServicesCount: 22,
    creativeColor: '#45b7d1',
    creativeAvatarUrl: undefined,
  },
];

export function AllServicesTab() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creativeFilter, setCreativeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleCreativeChange = (event: SelectChangeEvent) => {
    setCreativeFilter(event.target.value);
  };

  const handleDateChange = (event: SelectChangeEvent) => {
    setDateFilter(event.target.value);
  };

  // Filter logic
  const getFilteredOrders = () => {
    return dummyOrders.filter(order => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          order.serviceName.toLowerCase().includes(query) ||
          order.creativeName.toLowerCase().includes(query) ||
          order.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Creative filter
      if (creativeFilter !== 'all') {
        const creative = dummyConnectedCreatives.find(c => c.id === creativeFilter);
        if (creative && order.creativeName !== creative.name) {
          return false;
        }
      }

      // Date filter (based on order date)
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.orderDate);
        const now = new Date();
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (dateFilter) {
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
          case '3months':
            if (diffDays > 90) return false;
            break;
          case '6months':
            if (diffDays > 180) return false;
            break;
          case 'year':
            if (diffDays > 365) return false;
            break;
        }
      }

      return true;
    });
  };

  const filteredOrders = getFilteredOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return '#ff9800';
      case 'payment-approval':
        return '#00bcd4';
      case 'in-progress':
        return '#2196f3';
      case 'download':
        return '#0097a7';
      case 'completed':
        return '#4caf50';
      case 'canceled':
        return '#f44336';
      case 'locked':
        return '#9c27b0';
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
      {/* Search and Filters Section */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        alignItems: { xs: 'stretch', md: 'center' }
      }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: { xs: 1, md: 2 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
            },
          }}
        />

        {/* Status Filter */}
        <FormControl 
          sx={{ 
            minWidth: { xs: '100%', md: 180 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        >
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            label="Status"
            onChange={handleStatusChange}
            startAdornment={
              <InputAdornment position="start">
                <FilterList sx={{ fontSize: 20, ml: 0.5 }} />
              </InputAdornment>
            }
          >
            <MenuItem value="all" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                All Statuses
              </Box>
            </MenuItem>
            <MenuItem value="placed" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('placed') 
                }} />
                Placed
              </Box>
            </MenuItem>
            <MenuItem value="payment-approval" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('payment-approval') 
                }} />
                Payment Approval
              </Box>
            </MenuItem>
            <MenuItem value="in-progress" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('in-progress') 
                }} />
                In Progress
              </Box>
            </MenuItem>
            <MenuItem value="download" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('download') 
                }} />
                Download
              </Box>
            </MenuItem>
            <MenuItem value="completed" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('completed') 
                }} />
                Completed
              </Box>
            </MenuItem>
            <MenuItem value="locked" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('locked') 
                }} />
                Locked
              </Box>
            </MenuItem>
            <MenuItem value="canceled" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: getStatusColor('canceled') 
                }} />
                Canceled
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Connected Creative Filter */}
        <FormControl 
          sx={{ 
            minWidth: { xs: '100%', md: 200 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        >
          <InputLabel id="creative-filter-label">Connected Creative</InputLabel>
          <Select
            labelId="creative-filter-label"
            id="creative-filter"
            value={creativeFilter}
            label="Connected Creative"
            onChange={handleCreativeChange}
          >
            <MenuItem value="all" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              All Creatives
            </MenuItem>
            {dummyConnectedCreatives.map((creative) => (
              <MenuItem key={creative.id} value={creative.id} sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  color: theme.palette.primary.main,
                  backgroundColor: 'transparent !important',
                },
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  fontWeight: 600,
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'transparent !important',
                },
              }}>
                {creative.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Range Filter */}
        <FormControl 
          sx={{ 
            minWidth: { xs: '100%', md: 180 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        >
          <InputLabel id="date-filter-label">Time Period</InputLabel>
          <Select
            labelId="date-filter-label"
            id="date-filter"
            value={dateFilter}
            label="Time Period"
            onChange={handleDateChange}
            startAdornment={
              <InputAdornment position="start">
                <DateRange sx={{ fontSize: 20, ml: 0.5 }} />
              </InputAdornment>
            }
          >
            <MenuItem value="all" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              All Time
            </MenuItem>
            <MenuItem value="week" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past Week
            </MenuItem>
            <MenuItem value="month" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past Month
            </MenuItem>
            <MenuItem value="3months" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past 3 Months
            </MenuItem>
            <MenuItem value="6months" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past 6 Months
            </MenuItem>
            <MenuItem value="year" sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                color: theme.palette.primary.main,
                backgroundColor: 'transparent !important',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                fontWeight: 600,
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}>
              Past Year
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Orders Content Area */}
      <Box sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflowY: 'auto',
        overflowX: 'visible',
        pr: 1,
        pt: 1,
        maxHeight: 'calc(100vh - 300px)',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          },
        },
      }}>
        {filteredOrders.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 8,
            gap: 1
          }}>
            <Search sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.3 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              No orders found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled'}}>
              Try adjusting your filters or search query
            </Typography>
            <Button
              variant="contained"
              startIcon={<ShoppingBag />}
              onClick={() => navigate('/client/book')}
              sx={{
                mt: 2,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(59, 130, 246, 0.5)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Browse Services
            </Button>
          </Box>
        ) : (
          filteredOrders.map((order) => {
            const commonProps = {
              key: order.id,
              id: order.id,
              serviceName: order.serviceName,
              creativeName: order.creativeName,
              orderDate: order.orderDate,
              description: order.description,
              price: order.price,
            };

            switch (order.status) {
              case 'placed':
                return <PlacedOrderCard 
                  {...commonProps} 
                  calendarDate={order.calendarDate}
                  paymentOption={order.paymentOption}
                  serviceId={order.serviceId}
                  serviceDescription={order.serviceDescription}
                  serviceDeliveryTime={order.serviceDeliveryTime}
                  serviceColor={order.serviceColor}
                />;
              
              case 'payment-approval':
                return <PaymentApprovalOrderCard 
                  {...commonProps} 
                  calendarDate={order.calendarDate}
                  paymentOption={(order.paymentOption === 'split_payment' || order.paymentOption === 'payment_upfront') ? order.paymentOption : 'payment_upfront'}
                  depositAmount={order.depositAmount}
                  remainingAmount={order.remainingAmount}
                  serviceId={order.serviceId}
                  serviceDescription={order.serviceDescription}
                  serviceDeliveryTime={order.serviceDeliveryTime}
                  serviceColor={order.serviceColor}
                  creativeId={order.creativeId}
                  creativeDisplayName={order.creativeDisplayName}
                  creativeTitle={order.creativeTitle}
                  creativeEmail={order.creativeEmail}
                  creativeRating={order.creativeRating}
                  creativeReviewCount={order.creativeReviewCount}
                  creativeServicesCount={order.creativeServicesCount}
                  creativeColor={order.creativeColor}
                />;
              
              case 'in-progress':
                return (
                  <InProgressOrderCard
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    calendarDate={order.calendarDate}
                    paymentOption={order.paymentOption}
                    amountPaid={order.amountPaid}
                    amountRemaining={order.amountRemaining}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                  />
                );
              
              case 'locked':
                return (
                  <LockedOrderCard
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                    fileSize={order.fileSize}
                    paymentOption={order.paymentOption}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                  />
                );
              
              case 'download':
                return (
                  <DownloadOrderCard
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                    fileSize={order.fileSize}
                    paymentOption={order.paymentOption}
                    files={order.files}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                  />
                );
              
              case 'completed':
                return (
                  <CompletedOrderCard
                    {...commonProps}
                    approvedDate={order.approvedDate}
                    completedDate={order.completedDate}
                    calendarDate={order.calendarDate}
                    fileCount={order.fileCount}
                    fileSize={order.fileSize}
                    paymentOption={order.paymentOption}
                    files={order.files}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                  />
                );
              
              case 'canceled':
                return (
                  <CanceledOrderCard
                    {...commonProps}
                    canceledDate={(order as any).canceledDate}
                    paymentOption={order.paymentOption}
                    serviceId={order.serviceId}
                    serviceDescription={order.serviceDescription}
                    serviceDeliveryTime={order.serviceDeliveryTime}
                    serviceColor={order.serviceColor}
                    creativeId={order.creativeId}
                    creativeDisplayName={order.creativeDisplayName}
                    creativeTitle={order.creativeTitle}
                    creativeEmail={order.creativeEmail}
                    creativeRating={order.creativeRating}
                    creativeReviewCount={order.creativeReviewCount}
                    creativeServicesCount={order.creativeServicesCount}
                    creativeColor={order.creativeColor}
                    creativeAvatarUrl={order.creativeAvatarUrl}
                  />
                );
              
              default:
                return null;
            }
          })
        )}
      </Box>
    </Box>
  );
}
